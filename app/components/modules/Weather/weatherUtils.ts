export const getWeatherIcon = (code: number, isDay: boolean = true) => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs

  const icons: Record<number, string | { day: string; night: string }> = {
    0: { day: "i-heroicons-sun", night: "i-heroicons-moon" }, // Clear sky
    1: { day: "i-heroicons-sun", night: "i-heroicons-moon" }, // Mainly clear
    2: { day: "i-heroicons-cloud-mini", night: "i-heroicons-cloud-mini" }, // Partly cloudy
    3: { day: "i-heroicons-cloud", night: "i-heroicons-cloud" }, // Overcast
    45: "i-heroicons-cloud", // Fog
    48: "i-heroicons-cloud", // Depositing rime fog
    51: "i-heroicons-cloud-mini", // Drizzle: Light
    53: "i-heroicons-cloud-mini", // Drizzle: Moderate
    55: "i-heroicons-cloud-mini", // Drizzle: Dense intensity
    56: "i-heroicons-cloud-mini", // Freezing Drizzle: Light
    57: "i-heroicons-cloud-mini", // Freezing Drizzle: Dense intensity
    61: "i-heroicons-cloud-mini", // Rain: Slight
    63: "i-heroicons-cloud-mini", // Rain: Moderate
    65: "i-heroicons-cloud-mini", // Rain: Heavy intensity
    66: "i-heroicons-cloud-mini", // Freezing Rain: Light
    67: "i-heroicons-cloud-mini", // Freezing Rain: Heavy intensity
    71: "i-heroicons-cloud-mini", // Snow fall: Slight
    73: "i-heroicons-cloud-mini", // Snow fall: Moderate
    75: "i-heroicons-cloud-mini", // Snow fall: Heavy intensity
    77: "i-heroicons-cloud-mini", // Snow grains
    80: "i-heroicons-cloud-mini", // Rain showers: Slight
    81: "i-heroicons-cloud-mini", // Rain showers: Moderate
    82: "i-heroicons-cloud-mini", // Rain showers: Violent
    85: "i-heroicons-cloud-mini", // Snow showers: Slight
    86: "i-heroicons-cloud-mini", // Snow showers: Heavy
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
