// Netlify Function for SkyCast weather API.
export default async function (request) {
  try {
    // Get the WeatherAPI key from Netlify environment variables.
    const API_KEY = process.env.WEATHER_API_KEY;

    // Make sure the API key exists.
    if (!API_KEY) {
      return jsonResponse(
        {
          error: "WEATHER_API_KEY is missing."
        },
        500
      );
    }

    // Read the request URL.
    const url = new URL(request.url);

    // Get the requested path.
    const pathname = url.pathname;

    // Get the location from the query string.
    const location = String(
      url.searchParams.get("location") || ""
    ).trim();

    // Get the number of forecast days.
    const days = Math.min(
      Math.max(
        Number(url.searchParams.get("days")) || 3,
        1
      ),
      3
    );

    // Handle weather requests.
    if (pathname.includes("/weather")) {
      // Check that a location was provided.
      if (!location) {
        return jsonResponse(
          {
            error: "Location is required."
          },
          400
        );
      }

      // Build the WeatherAPI forecast URL.
      const weatherUrl =
        "https://api.weatherapi.com/v1/forecast.json" +
        `?key=${encodeURIComponent(API_KEY)}` +
        `&q=${encodeURIComponent(location)}` +
        `&days=${days}` +
        "&aqi=yes" +
        "&alerts=yes";

      // Request weather data from WeatherAPI.
      const response = await fetch(weatherUrl);

      // Convert the response to JSON.
      const data = await response.json();

      // Handle WeatherAPI errors.
      if (!response.ok) {
        return jsonResponse(
          {
            error:
              data?.error?.message ||
              "Weather API error."
          },
          response.status
        );
      }

      // Return the real weather data to the frontend.
      return jsonResponse(data, 200);
    }

    // Handle location search requests.
    if (pathname.includes("/search")) {
      // If no search query exists, return an empty array.
      if (!location) {
        return jsonResponse([], 200);
      }

      // Build the WeatherAPI search URL.
      const searchUrl =
        "https://api.weatherapi.com/v1/search.json" +
        `?key=${encodeURIComponent(API_KEY)}` +
        `&q=${encodeURIComponent(location)}`;

      // Request location suggestions.
      const response = await fetch(searchUrl);

      // Convert the response to JSON.
      const data = await response.json();

      // Handle WeatherAPI errors.
      if (!response.ok) {
        return jsonResponse(
          {
            error:
              data?.error?.message ||
              "Search error."
          },
          response.status
        );
      }

      // Return search results.
      return jsonResponse(data, 200);
    }

    // Test the function root endpoint.
    return jsonResponse(
      {
        ok: true,
        message: "SkyCast Netlify Function is working"
      },
      200
    );
  } catch (error) {
    // Print the error in Netlify Function logs.
    console.error("SkyCast Function Error:", error);

    // Return a safe error to the frontend.
    return jsonResponse(
      {
        error: "Unable to process the request."
      },
      500
    );
  }
}


// Create a JSON response for Netlify.
function jsonResponse(data, statusCode) {
  return new Response(
    JSON.stringify(data),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}