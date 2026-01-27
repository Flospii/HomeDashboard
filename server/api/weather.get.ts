import { defineEventHandler, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { lat, lon } = query;

  if (!lat || !lon) {
    throw createError({
      statusCode: 400,
      statusMessage: "Latitude and Longitude are required",
    });
  }

  try {
    // 1. Fetch Weather Data
    const weatherPromise = fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`,
    );

    // 2. Fetch Location Name (Reverse Geocoding)
    const locationPromise = fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      {
        headers: {
          "User-Agent":
            "HomeDashboard/2.0 (https://github.com/flospii/HomeDashboard)",
        },
      },
    );

    const [weatherRes, locationRes] = await Promise.all([
      weatherPromise,
      locationPromise,
    ]);

    if (!weatherRes.ok) {
      throw new Error(
        `Weather API responded with status: ${weatherRes.status}`,
      );
    }

    const weatherData = await weatherRes.json();
    let locationName = "Unknown Location";

    if (locationRes.ok) {
      const locationData = await locationRes.json();
      locationName =
        locationData.address.city ||
        locationData.address.town ||
        locationData.address.village ||
        locationData.address.suburb ||
        "Unknown Location";
    }

    // Extract current hour index for hourly data
    const currentHourIndex = new Date().getHours();

    return {
      location: locationName,
      current: {
        temp: Math.round(weatherData.current_weather.temperature),
        windSpeed: weatherData.current_weather.windspeed,
        weatherCode: weatherData.current_weather.weathercode,
        isDay: !!weatherData.current_weather.is_day,
        humidity: weatherData.hourly.relativehumidity_2m[currentHourIndex],
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
  } catch (error: any) {
    console.error("Weather API Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch weather data: ${error.message}`,
    });
  }
});
