import { defineEventHandler, getQuery, createError } from "h3";

const weatherCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { lat, lon } = query;

  if (!lat || !lon) {
    throw createError({
      statusCode: 400,
      statusMessage: "Latitude and Longitude are required",
    });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    // 1. Fetch Weather Data (Required)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`,
    );

    if (!weatherRes.ok) {
      throw new Error(
        `Weather API responded with status: ${weatherRes.status}`,
      );
    }

    const weatherData = await weatherRes.json();

    // 2. Fetch Location Name (Optional - Reverse Geocoding)
    // Run independently to prevent Nominatim rate-limiting or network issues from failing the entire request
    let locationName = "Unknown Location";
    try {
      const locationRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        {
          headers: {
            "User-Agent":
              "HomeDashboard/2.0 (https://github.com/flospii/HomeDashboard)",
          },
        },
      );
      if (locationRes.ok) {
        const locationData = await locationRes.json();
        locationName =
          locationData.address?.city ||
          locationData.address?.town ||
          locationData.address?.village ||
          locationData.address?.suburb ||
          "Unknown Location";
      }
    } catch (locationError) {
      console.warn("Weather API: reverse geocoding failed (non-fatal):", locationError);
    }

    // Extract current hour index for hourly data safely
    const currentHourIndex = new Date().getHours();
    const relativeHumidityArray = weatherData.hourly?.relativehumidity_2m;
    const humidity = Array.isArray(relativeHumidityArray) && currentHourIndex < relativeHumidityArray.length
      ? relativeHumidityArray[currentHourIndex]
      : null;

    const result = {
      location: locationName,
      current: {
        temp: Math.round(weatherData.current_weather.temperature),
        windSpeed: weatherData.current_weather.windspeed,
        weatherCode: weatherData.current_weather.weathercode,
        isDay: !!weatherData.current_weather.is_day,
        humidity,
        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],
      },
      daily: weatherData.daily.time
        .map((time: string, i: number) => ({
          date: time,
          weatherCode: weatherData.daily.weathercode[i],
          tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
          tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
        }))
        .slice(1, 6), // Next 5 days
    };

    weatherCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });
    return result;
  } catch (error: any) {
    console.error("Weather API Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch weather data: ${error.message}`,
    });
  }
});
