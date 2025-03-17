// Display weather information once data is fetched
function displayWeather(data) {
  const container = document.getElementById("weather-container");
  const weatherInfo = document.getElementById("weather-info");
  const weather = data.current_weather;
  if (weather) {
    const temperature = weather.temperature;
    const windspeed = weather.windspeed;
    weatherInfo.innerHTML = `Temperature: ${temperature}°C<br>Windspeed: ${windspeed} km/h`;
  } else {
    weatherInfo.innerText = "Unable to retrieve weather data.";
  }
  container.classList.remove("hidden");
}

// Fetch weather data from Open-Meteo
function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  fetch(url)
    .then(response => response.json())
    .then(data => displayWeather(data))
    .catch(err => {
      console.error("Error fetching weather data:", err);
      document.getElementById("weather-info").innerText = "Error loading weather data.";
      document.getElementById("weather-container").classList.remove("hidden");
    });
}

// Attempt to load weather data using geolocation, fallback to New York if needed
function loadWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(lat, lon);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        // Fallback coordinates (New York City)
        fetchWeather(40.7128, -74.0060);
      }
    );
  } else {
    // Geolocation not supported
    fetchWeather(40.7128, -74.0060);
  }
}

loadWeather();

