// Import Express to create the backend server.
const express=require("express");

// Import path to work with file and folder paths.
const path=require("path");

// Import dotenv to load variables from .env.
const dotenv=require("dotenv");

// Load environment variables from .env.
dotenv.config();

// Create the Express application.
const app=express();

// Get the port from .env or use 3000.
const PORT=process.env.PORT||3000;

// Get the WeatherAPI key from .env.
const API_KEY=process.env.WEATHER_API_KEY;

// WeatherAPI base URL.
const BASE_URL="https://api.weatherapi.com/v1";

// Allow Express to read JSON request bodies.
app.use(express.json());

// Serve files from the public folder.
app.use(express.static(path.join(__dirname,"public")));

// Health-check route used to verify that the backend is running.
app.get("/api/health",(req,res)=>{
  res.json({
    ok:true,
    service:"SkyCast Weather Dashboard"
  });
});

// Get current weather and forecast for a location.
app.get("/api/weather",async(req,res)=>{
  try{
    const location=String(req.query.location||"").trim();
    const days=Math.min(Math.max(Number(req.query.days)||3,1),3);

    if(!API_KEY){
      return res.status(500).json({
        error:"WEATHER_API_KEY is missing."
      });
    }

    if(!location){
      return res.status(400).json({
        error:"Location is required."
      });
    }

    const url=
      `${BASE_URL}/forecast.json`+
      `?key=${encodeURIComponent(API_KEY)}`+
      `&q=${encodeURIComponent(location)}`+
      `&days=${days}`+
      `&aqi=yes`+
      `&alerts=yes`;

    const response=await fetch(url);
    const data=await response.json();

    if(!response.ok){
      return res.status(response.status).json({
        error:data?.error?.message||"Weather API error."
      });
    }

    res.json(data);
  }catch(error){
    console.error("Weather error:",error);

    res.status(500).json({
      error:"Unable to fetch weather data."
    });
  }
});

// Search locations for autocomplete.
app.get("/api/search",async(req,res)=>{
  try{
    const query=String(req.query.query||"").trim();

    if(!API_KEY){
      return res.status(500).json({
        error:"WEATHER_API_KEY is missing."
      });
    }

    if(!query){
      return res.json([]);
    }

    const url=
      `${BASE_URL}/search.json`+
      `?key=${encodeURIComponent(API_KEY)}`+
      `&q=${encodeURIComponent(query)}`;

    const response=await fetch(url);
    const data=await response.json();

    if(!response.ok){
      return res.status(response.status).json({
        error:data?.error?.message||"Search error."
      });
    }

    res.json(data);
  }catch(error){
    console.error("Search error:",error);

    res.status(500).json({
      error:"Unable to search locations."
    });
  }
});

// Return index.html for normal browser routes.
app.get(/.*/,(req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","index.html")
  );
});

// Start the Express server.
app.listen(PORT,()=>{
  console.log(`
=================================
   SkyCast Weather Dashboard
=================================
Server: http://localhost:${PORT}
Health: http://localhost:${PORT}/api/health
=================================
`);
});