"use strict";

/* Store the user's current application settings and weather data. */
const state={
  unit:localStorage.getItem("unit")||"C",
  theme:localStorage.getItem("theme")||"dark",
  weather:null,
  chart:null,
  favorites:JSON.parse(localStorage.getItem("favorites")||"[]")
};

/* Get an HTML element using its ID. */
const $=id=>document.getElementById(id);

/* Store references to all HTML elements used by JavaScript. */
const els={
  searchForm:$("searchForm"),
  searchInput:$("searchInput"),
  searchBtn:$("searchBtn"),
  locationBtn:$("locationBtn"),
  unitToggle:$("unitToggle"),
  themeToggle:$("themeToggle"),
  suggestions:$("suggestions"),
  error:$("error"),
  loading:$("loading"),
  dashboard:$("dashboard"),
  emptyState:$("emptyState"),
  locationName:$("locationName"),
  locationMeta:$("locationMeta"),
  updatedAt:$("updatedAt"),
  favoriteBtn:$("favoriteBtn"),
  currentTemp:$("currentTemp"),
  feelsLike:$("feelsLike"),
  currentIcon:$("currentIcon"),
  currentCondition:$("currentCondition"),
  highTemp:$("highTemp"),
  lowTemp:$("lowTemp"),
  humidity:$("humidity"),
  wind:$("wind"),
  visibility:$("visibility"),
  uv:$("uv"),
  pressure:$("pressure"),
  precipitation:$("precipitation"),
  forecastGrid:$("forecastGrid"),
  weatherChart:$("weatherChart"),
  pm25:$("pm25"),
  pm10:$("pm10"),
  o3:$("o3"),
  no2:$("no2"),
  sunrise:$("sunrise"),
  sunset:$("sunset"),
  daylight:$("daylight"),
  weatherTips:$("weatherTips"),
  alerts:$("alerts")
};

/* Initialize the application after the HTML page has loaded. */
document.addEventListener("DOMContentLoaded",()=>{
  applyTheme();
  updateUnit();

  els.searchForm.addEventListener(
    "submit",
    event=>{
      event.preventDefault();
      searchWeather();
    }
  );

  els.unitToggle.addEventListener(
    "click",
    toggleUnit
  );

  els.themeToggle.addEventListener(
    "click",
    toggleTheme
  );

  els.locationBtn.addEventListener(
    "click",
    getCurrentLocation
  );

  els.favoriteBtn.addEventListener(
    "click",
    toggleFavorite
  );

  els.searchInput.addEventListener(
    "input",
    handleSearchInput
  );

  els.searchInput.addEventListener(
    "keydown",
    handleSearchKey
  );
});

/* Read the city entered by the user and request its weather. */
function searchWeather(){
  const location=els.searchInput.value.trim();

  if(!location){
    showError("Please enter a city or location.");
    return;
  }

  loadWeather(location);
}

/* Send the selected location to our Express backend. */
async function loadWeather(location){
  hideError();
  showLoading();

  els.searchBtn.disabled=true;

  try{
    const response=await fetch(
      `/api/weather?location=${encodeURIComponent(location)}&days=3`
    );

    const data=await response.json();

    if(!response.ok||data.error){
      throw new Error(
        data.error||"Unable to load weather."
      );
    }

    state.weather=data;

    renderWeather(data);

  }catch(error){
    console.error("Weather error:",error);
    showError(error.message);
  }finally{
    hideLoading();
    els.searchBtn.disabled=false;
  }
}

/* Display all weather information returned by the backend. */
function renderWeather(data){
  const location=data.location||{};
  const current=data.current||{};
  const forecast=data.forecast||{};
  const today=forecast.forecastday?.[0];

  els.dashboard.hidden=false;
  els.emptyState.hidden=true;

  els.locationName.textContent=
    location.name||"Unknown";

  els.locationMeta.textContent=
    [location.region,location.country]
      .filter(Boolean)
      .join(", ");

  els.updatedAt.textContent=
    "Updated just now";

  els.currentTemp.textContent=
    formatTemperature(current.temp_c);

  els.feelsLike.textContent=
    `Feels like ${formatTemperature(current.feelslike_c)}`;

  els.currentCondition.textContent=
    current.condition?.text||"—";

  els.currentIcon.src=
    normalizeIcon(current.condition?.icon);

  els.currentIcon.alt=
    current.condition?.text||"Weather";

  els.highTemp.textContent=
    `High ${formatTemperature(today?.day?.maxtemp_c)}`;

  els.lowTemp.textContent=
    `Low ${formatTemperature(today?.day?.mintemp_c)}`;

  els.humidity.textContent=
    formatValue(current.humidity,"%");

  els.wind.textContent=
    formatWind(current);

  els.visibility.textContent=
    formatValue(current.vis_km," km");

  els.uv.textContent=
    formatValue(current.uv);

  els.pressure.textContent=
    formatValue(current.pressure_mb," mb");

  els.precipitation.textContent=
    formatValue(current.precip_mm," mm");

  renderForecast(
    forecast.forecastday||[]
  );

  renderHourlyChart(
    today?.hour||[]
  );

  renderAirQuality(
    current.air_quality||{}
  );

  renderSun(
    today?.astro
  );

  renderWeatherTips(
    current,
    today?.day
  );

  renderAlerts(
    data.alerts?.alert||[]
  );

  updateFavoriteButton();
}

/* Create the cards for the next three forecast days. */
function renderForecast(days){
  els.forecastGrid.innerHTML=
    days.map(day=>{
      const date=new Date(day.date);

      const dayName=
        date.toLocaleDateString(
          undefined,
          {weekday:"short"}
        );

      const condition=
        day.day?.condition?.text||"—";

      return `
        <article class="forecast-card">

          <div class="forecast-day">
            ${escapeHTML(dayName)}
          </div>

          <img
            class="forecast-icon"
            src="${normalizeIcon(day.day?.condition?.icon)}"
            alt="${escapeHTML(condition)}"
          >

          <div class="forecast-condition">
            ${escapeHTML(condition)}
          </div>

          <div class="forecast-temperature">

            <strong>
              ${formatTemperature(day.day?.maxtemp_c)}
            </strong>

            <span>
              ${formatTemperature(day.day?.mintemp_c)}
            </span>

          </div>

          <div class="forecast-extra">

            <span>
              💧 ${day.day?.daily_chance_of_rain||0}%
            </span>

            <span>
              💨 ${formatNumber(day.day?.maxwind_kph)} km/h
            </span>

          </div>

        </article>
      `;
    })
    .join("");
}

/* Create the hourly temperature line chart using Chart.js. */
function renderHourlyChart(hours){
  if(!els.weatherChart)return;

  if(typeof Chart==="undefined"){
    console.warn("Chart.js is not loaded.");
    return;
  }

  if(state.chart){
    state.chart.destroy();
  }

  const currentHour=
    new Date().getHours();

  let selectedHours=
    hours.filter(hour=>{
      return new Date(hour.time).getHours()>=currentHour;
    });

  selectedHours=
    selectedHours.slice(0,12);

  if(!selectedHours.length){
    selectedHours=hours.slice(0,12);
  }

  const labels=
    selectedHours.map(hour=>{
      return new Date(
        hour.time
      ).toLocaleTimeString(
        [],
        {
          hour:"numeric",
          minute:"2-digit"
        }
      );
    });

  const temperatures=
    selectedHours.map(hour=>{
      return convertTemperature(
        Number(hour.temp_c)
      );
    });

  state.chart=new Chart(
    els.weatherChart.getContext("2d"),
    {
      type:"line",

      data:{
        labels,

        datasets:[
          {
            label:
              `Temperature °${state.unit}`,

            data:temperatures,

            tension:.35,

            fill:true,

            borderWidth:2,

            pointRadius:3
          }
        ]
      },

      options:{
        responsive:true,

        maintainAspectRatio:false,

        plugins:{
          legend:{
            display:true
          }
        },

        scales:{
          y:{
            ticks:{
              callback:value=>{
                return `${value}°`;
              }
            }
          }
        }
      }
    }
  );
}

/* Display PM2.5, PM10, ozone and nitrogen dioxide values. */
function renderAirQuality(air){
  els.pm25.textContent=
    formatNumber(air.pm2_5);

  els.pm10.textContent=
    formatNumber(air.pm10);

  els.o3.textContent=
    formatNumber(air.o3);

  els.no2.textContent=
    formatNumber(air.no2);
}

/* Display sunrise, sunset and total daylight duration. */
function renderSun(astro){
  els.sunrise.textContent=
    astro?.sunrise||"—";

  els.sunset.textContent=
    astro?.sunset||"—";

  els.daylight.textContent=
    calculateDaylight(
      astro?.sunrise,
      astro?.sunset
    );
}

/* Generate useful practical advice based on current conditions. */
function renderWeatherTips(current,day){
  const tips=[];

  const temperature=
    Number(current.temp_c);

  const uv=
    Number(current.uv);

  const humidity=
    Number(current.humidity);

  const rain=
    Number(day?.daily_chance_of_rain);

  if(temperature>=35){
    tips.push(
      "High temperature. Stay hydrated and avoid prolonged direct sunlight."
    );
  }else if(temperature<=10){
    tips.push(
      "Cool conditions. Consider wearing an extra layer."
    );
  }

  if(uv>=6){
    tips.push(
      "UV levels are elevated. Consider sun protection."
    );
  }

  if(humidity>=75){
    tips.push(
      "Humidity is high and may make conditions feel warmer."
    );
  }

  if(rain>=50){
    tips.push(
      `Rain chance is ${rain}%. Carry an umbrella.`
    );
  }

  if(!tips.length){
    tips.push(
      "Conditions look comfortable. Check the hourly forecast before heading outside."
    );
  }

  els.weatherTips.innerHTML=
    tips.map(tip=>{
      return `
        <div class="tip-item">
          <span>💡</span>
          <span>${escapeHTML(tip)}</span>
        </div>
      `;
    }).join("");
}

/* Display active weather alerts or a no-alert message. */
function renderAlerts(alerts){
  if(!alerts.length){
    els.alerts.innerHTML=
      `<div class="alert-empty">
        ✓ No active weather alerts
      </div>`;

    return;
  }

  els.alerts.innerHTML=
    alerts.map(alert=>{
      return `
        <div class="weather-alert">

          <strong>
            ${escapeHTML(
              alert.headline||
              alert.event||
              "Weather Alert"
            )}
          </strong>

          <p>
            ${escapeHTML(
              alert.desc||""
            )}
          </p>

        </div>
      `;
    }).join("");
}

/* Switch the application between Celsius and Fahrenheit. */
function toggleUnit(){
  state.unit=
    state.unit==="C"?"F":"C";

  localStorage.setItem(
    "unit",
    state.unit
  );

  updateUnit();

  if(state.weather){
    renderWeather(
      state.weather
    );
  }
}

/* Update the temperature unit button text. */
function updateUnit(){
  els.unitToggle.textContent=
    `°${state.unit}`;
}

/* Switch between dark and light theme. */
function toggleTheme(){
  state.theme=
    state.theme==="dark"
      ?"light"
      :"dark";

  localStorage.setItem(
    "theme",
    state.theme
  );

  applyTheme();
}

/* Apply the saved theme to the page. */
function applyTheme(){
  document.body.classList.toggle(
    "light",
    state.theme==="light"
  );

  els.themeToggle.textContent=
    state.theme==="dark"
      ?"☀"
      :"🌙";
}

/* Request the user's location and load weather for it. */
function getCurrentLocation(){
  if(!navigator.geolocation){
    showError(
      "Geolocation is not supported by your browser."
    );

    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    position=>{
      const latitude=
        position.coords.latitude;

      const longitude=
        position.coords.longitude;

      loadWeather(
        `${latitude},${longitude}`
      );
    },

    ()=>{
      hideLoading();

      showError(
        "Unable to access your location."
      );
    }
  );
}

/* Search for locations while the user types. */
async function handleSearchInput(){
  const query=
    els.searchInput.value.trim();

  if(query.length<2){
    clearSuggestions();
    return;
  }

  try{
    const response=
      await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );

    const data=
      await response.json();

    if(!response.ok||data.error){
      return;
    }

    showSuggestions(data);

  }catch(error){
    console.warn(
      "Location search error:",
      error
    );
  }
}

/* Allow the Enter key to submit the city search. */
function handleSearchKey(event){
  if(event.key==="Enter"){
    event.preventDefault();
    searchWeather();
  }
}

/* Display location suggestions below the search input. */
function showSuggestions(locations){
  clearSuggestions();

  if(!Array.isArray(locations)||!locations.length){
    return;
  }

  locations.slice(0,5).forEach(location=>{

    const button=
      document.createElement("button");

    button.type="button";

    button.className=
      "suggestion-item";

    button.textContent=
      [
        location.name,
        location.region,
        location.country
      ]
      .filter(Boolean)
      .join(", ");

    button.addEventListener(
      "click",
      ()=>{
        const value=
          [
            location.name,
            location.country
          ]
          .filter(Boolean)
          .join(", ");

        els.searchInput.value=value;

        clearSuggestions();

        loadWeather(value);
      }
    );

    els.suggestions.appendChild(
      button
    );
  });
}

/* Remove all location suggestions from the search area. */
function clearSuggestions(){
  els.suggestions.innerHTML="";
}

/* Add or remove the currently displayed city from favorites. */
function toggleFavorite(){
  const location=
    els.locationName.textContent;

  if(!location||location==="—"){
    return;
  }

  const exists=
    state.favorites.includes(location);

  if(exists){
    state.favorites=
      state.favorites.filter(
        item=>item!==location
      );
  }else{
    state.favorites.push(location);
  }

  localStorage.setItem(
    "favorites",
    JSON.stringify(
      state.favorites
    )
  );

  updateFavoriteButton();
}

/* Change the favorite button between star and empty star. */
function updateFavoriteButton(){
  const location=
    els.locationName.textContent;

  els.favoriteBtn.textContent=
    state.favorites.includes(location)
      ?"★"
      :"☆";
}

/* Show the loading message while the API request is running. */
function showLoading(){
  els.loading.hidden=false;
}

/* Hide the loading message after the API request finishes. */
function hideLoading(){
  els.loading.hidden=true;
}

/* Display an error message to the user. */
function showError(message){
  els.error.textContent=message;
  els.error.hidden=false;
}

/* Hide the current error message. */
function hideError(){
  els.error.hidden=true;
}

/* Convert Celsius temperature into the selected unit. */
function convertTemperature(celsius){
  if(!Number.isFinite(celsius)){
    return NaN;
  }

  if(state.unit==="F"){
    return celsius*9/5+32;
  }

  return celsius;
}

/* Format a temperature with its unit symbol. */
function formatTemperature(celsius){
  const value=
    Number(celsius);

  if(!Number.isFinite(value)){
    return "—";
  }

  return `${Math.round(
    convertTemperature(value)
  )}°${state.unit}`;
}

/* Format a normal numeric weather value. */
function formatNumber(value){
  const number=
    Number(value);

  if(!Number.isFinite(number)){
    return "—";
  }

  return Number.isInteger(number)
    ?String(number)
    :number.toFixed(1);
}

/* Format a numeric value with an optional unit. */
function formatValue(value,suffix=""){
  const number=
    Number(value);

  if(!Number.isFinite(number)){
    return "—";
  }

  return `${formatNumber(number)}${suffix}`;
}

/* Format the wind speed according to the selected unit. */
function formatWind(current){
  if(state.unit==="F"){
    return formatValue(
      current.wind_mph,
      " mph"
    );
  }

  return formatValue(
    current.wind_kph,
    " km/h"
  );
}

/* Convert WeatherAPI's icon URL into a browser-ready URL. */
function normalizeIcon(icon){
  if(!icon){
    return "";
  }

  if(icon.startsWith("//")){
    return `https:${icon}`;
  }

  return icon;
}

/* Calculate the total daylight duration from sunrise and sunset. */
function calculateDaylight(sunrise,sunset){
  if(!sunrise||!sunset){
    return "—";
  }

  const start=
    parseTime(sunrise);

  const end=
    parseTime(sunset);

  if(start===null||end===null){
    return "—";
  }

  let difference=
    end-start;

  if(difference<0){
    difference+=1440;
  }

  const hours=
    Math.floor(difference/60);

  const minutes=
    difference%60;

  return `${hours}h ${minutes}m`;
}

/* Convert a time such as 6:15 AM into minutes after midnight. */
function parseTime(value){
  const match=
    String(value).match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

  if(!match){
    return null;
  }

  let hours=
    Number(match[1]);

  const minutes=
    Number(match[2]);

  const period=
    match[3].toUpperCase();

  if(period==="PM"&&hours!==12){
    hours+=12;
  }

  if(period==="AM"&&hours===12){
    hours=0;
  }

  return hours*60+minutes;
}

/* Escape text before placing it inside HTML. */
function escapeHTML(value){
  return String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* Close location suggestions when the user clicks elsewhere. */
document.addEventListener(
  "click",
  event=>{
    if(
      !event.target.closest(".search-card")
    ){
      clearSuggestions();
    }
  }
);