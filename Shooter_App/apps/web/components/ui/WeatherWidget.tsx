"use client";

import React, { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Thermometer } from "lucide-react";

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Phoenix coordinates as default
    const lat = 33.4484;
    const lon = -112.0740;
    
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`)
      .then(res => res.json())
      .then(data => {
        setWeather(data.current);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch weather", err);
        setLoading(false);
      });
  }, []);

  if (loading || !weather) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-muted)] animate-pulse text-sm">
        <Sun size={16} /> Loading weather...
      </div>
    );
  }

  // Very basic WMO code to icon/text
  const getWeatherIcon = (code: number) => {
    if (code === 0) return { icon: <Sun size={18} className="text-yellow-400" />, text: "Clear" };
    if (code >= 1 && code <= 3) return { icon: <Cloud size={18} className="text-gray-300" />, text: "Partly Cloudy" };
    if (code >= 51 && code <= 67) return { icon: <CloudRain size={18} className="text-blue-400" />, text: "Rain" };
    return { icon: <Cloud size={18} className="text-gray-400" />, text: "Cloudy" };
  };

  const { icon, text } = getWeatherIcon(weather.weather_code);

  return (
    <div className="flex items-center gap-4 bg-[var(--bg-void)] border border-[var(--border-subtle)] px-4 py-2 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-bold text-white text-sm">{Math.round(weather.temperature_2m)}°F</span>
      </div>
      <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
      <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs font-medium">
        <Wind size={14} />
        {Math.round(weather.wind_speed_10m)} mph
      </div>
    </div>
  );
}
