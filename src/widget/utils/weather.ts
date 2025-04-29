import { Location, WeatherResponse } from "../types/variables";
console.log({ env: import.meta.env });

export const getWeather = async (city: string) => {
  if (!city.trim()) {
    throw new Error("City name is required");
  }
  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?q=${city}&key=${
      import.meta.env.VITE_WEATHER_API_KEY
    }`
  );
  const data: WeatherResponse = await res.json();
  return data;
};

export const getCityFromIp = async () => {
  const res = await fetch(`http://ip-api.com/json`);
  const { city, regionName, country }: Partial<Location> = await res.json();
  return [city, regionName, country].filter(Boolean).join(", ");
};
