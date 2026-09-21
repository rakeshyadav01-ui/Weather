// Import Express.
const express = require("express");

// Convert the Express application into a Netlify serverless function.
const serverless = require("serverless-http");

// Create the Express application.
const app = express();

// Get the WeatherAPI key from Netlify environment variables.
const API_KEY = process.env.WEATHER_API_KEY;

// WeatherAPI base URL.
const BASE_URL = "https://api.weatherapi.com/v1";

// Allow Express to read JSON requests.
app.use(express.json());


// Test whether the Netlify Function is working.
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "SkyCast Weather Dashboard"
  });
});


// Get weather information for a location.
app.get("/weather", async (req, res) => {
  try {
    // Get the location from the URL query.
    const location = String(req.query.location || "").trim();

    // Get the number of forecast days.
    const days = Math.min(
      Math.max(Number(req.query.days) || 3, 1),
      3
    );

    // Check whether the WeatherAPI key exists.
    if (!API_KEY) {
      return res.status(500).json({
        error: "WEATHER_API_KEY is missing."
      });
    }

    // Check whether the user provided a location.
    if (!location) {
      return res.status(400).json({
        error: "Location is required."
      });
    }

    // Create the WeatherAPI request URL.
    const url =
      `${BASE_URL}/forecast.json` +
      `?key=${encodeURIComponent(API_KEY)}` +
      `&q=${encodeURIComponent(location)}` +
      `&days=${days}` +
      `&aqi=yes` +
      `&alerts=yes`;

    // Send the request to WeatherAPI.
    const response = await fetch(url);

    // Convert the WeatherAPI response into JSON.
    const data = await response.json();

    // Handle WeatherAPI errors.
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Weather API error."
      });
    }

    // Send the weather data back to the frontend.
    res.json(data);

  } catch (error) {
    // Print the error in the Netlify logs.
    console.error("Weather error:", error);

    // Send an error response to the frontend.
    res.status(500).json({
      error: "Unable to fetch weather data."
    });
  }
});


// Search locations for autocomplete.
app.get("/search", async (req, res) => {
  try {
    // Get the search text from the URL query.
    const query = String(req.query.query || "").trim();

    // Check whether the WeatherAPI key exists.
    if (!API_KEY) {
      return res.status(500).json({
        error: "WEATHER_API_KEY is missing."
      });
    }

    // Return an empty array when there is no search text.
    if (!query) {
      return res.json([]);
    }

    // Create the WeatherAPI search URL.
    const url =
      `${BASE_URL}/search.json` +
      `?key=${encodeURIComponent(API_KEY)}` +
      `&q=${encodeURIComponent(query)}`;

    // Send the request to WeatherAPI.
    const response = await fetch(url);

    // Convert the response into JSON.
    const data = await response.json();

    // Handle WeatherAPI errors.
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Search error."
      });
    }

    // Send the search results back to the frontend.
    res.json(data);

  } catch (error) {
    // Print the error in the Netlify logs.
    console.error("Search error:", error);

    // Send an error response to the frontend.
    res.status(500).json({
      error: "Unable to search locations."
    });
  }
});


// Export the Express application as a Netlify Function.
module.exports.handler = serverless(app);