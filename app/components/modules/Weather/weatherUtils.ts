export const getWeatherIcon = (code: number, isDay: boolean = true) => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs

  const icons: Record<number, string | { day: string; night: string }> = {
    0: { day: "i-heroicons-sun", night: "i-heroicons-moon" }, // Clear sky
    1: { day: "i-heroicons-sun", night: "i-heroicons-moon" }, // Mainly clear
    2: { day: "i-heroicons-cloud", night: "i-heroicons-cloud" }, // Partly cloudy
    3: { day: "i-heroicons-cloud", night: "i-heroicons-cloud" }, // Overcast
    45: "i-heroicons-cloud", // Fog
    48: "i-heroicons-cloud", // Depositing rime fog
    51: "i-heroicons-cloud", // Drizzle: Light
    53: "i-heroicons-cloud", // Drizzle: Moderate
    55: "i-heroicons-cloud", // Drizzle: Dense intensity
    56: "i-heroicons-cloud", // Freezing Drizzle: Light
    57: "i-heroicons-cloud", // Freezing Drizzle: Dense intensity
    61: "i-heroicons-cloud", // Rain: Slight
    63: "i-heroicons-cloud", // Rain: Moderate
    65: "i-heroicons-cloud", // Rain: Heavy intensity
    66: "i-heroicons-cloud", // Freezing Rain: Light
    67: "i-heroicons-cloud", // Freezing Rain: Heavy intensity
    71: "i-heroicons-cloud", // Snow fall: Slight
    73: "i-heroicons-cloud", // Snow fall: Moderate
    75: "i-heroicons-cloud", // Snow fall: Heavy intensity
    77: "i-heroicons-cloud", // Snow grains
    80: "i-heroicons-cloud", // Rain showers: Slight
    81: "i-heroicons-cloud", // Rain showers: Moderate
    82: "i-heroicons-cloud", // Rain showers: Violent
    85: "i-heroicons-cloud", // Snow showers: Slight
    86: "i-heroicons-cloud", // Snow showers: Heavy
    95: "i-heroicons-bolt", // Thunderstorm: Slight or moderate
    96: "i-heroicons-bolt", // Thunderstorm with slight hail
    99: "i-heroicons-bolt", // Thunderstorm with heavy hail
  };

  const icon = icons[code] || "i-heroicons-cloud";

  if (typeof icon === "string") {
    return icon;
  }

  return isDay ? icon.day : icon.night;
};
