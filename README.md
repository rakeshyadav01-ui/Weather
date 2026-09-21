# SkyCast — Advanced Weather Dashboard

A resume-ready weather intelligence dashboard built from the original Day 30 WeatherAPI project.

## Features

- Current weather and feels-like temperature
- 3-day forecast
- Hourly temperature trend with Chart.js
- WeatherAPI location autocomplete/search
- Browser geolocation (“Use my location”)
- Celsius / Fahrenheit toggle
- Air quality: PM2.5, PM10, O3 and NO2
- UV index, humidity, pressure, visibility, precipitation and wind
- Sunrise/sunset and daylight progress
- Practical weather tips
- Weather alerts when returned by the API
- Recent searches using localStorage
- Favorite locations using localStorage
- Dark/light theme
- Responsive mobile/tablet/desktop UI
- Loading and error states
- Express backend proxy so the WeatherAPI key is not placed in frontend JavaScript

## Setup

### 1. Install Node.js

Use a recent Node.js version (Node 18+ recommended).

### 2. Install packages

```bash
npm install
```

### 3. Create `.env`

Copy `.env.example` to `.env` and add your WeatherAPI key:

```env
WEATHER_API_KEY=your_real_key_here
PORT=3000
```

Get a key from WeatherAPI.com.

### 4. Start

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For development with automatic server restart:

```bash
npm run dev
```

## Project structure

```text
weather-dashboard-pro/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## API architecture

The browser calls your own Express endpoints:

```text
Browser
   ↓
Express /api/weather
   ↓
WeatherAPI.com
   ↓
Express
   ↓
Browser
```

This keeps the WeatherAPI key on the server instead of exposing it in `public/app.js`.

## Resume project description

**SkyCast — Weather Intelligence Dashboard**

Developed a responsive weather intelligence dashboard using HTML, CSS, JavaScript, Node.js and Express, integrating WeatherAPI for real-time conditions, multi-day forecasts, air-quality data and weather alerts. Implemented location search/autocomplete, browser geolocation, hourly visualization with Chart.js, unit conversion, favorites, recent searches, theme switching and localStorage-based preferences. Designed a responsive glassmorphism interface for desktop, tablet and mobile devices and used a backend API proxy to protect third-party API credentials.
