import { useEffect, useState } from "react";
import { CloudSun, AlertTriangle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function WeatherTab() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      const res = await apiFetch("/api/customer/weather");
      if (res.ok) {
        const data = await res.json();
        setWeather(data.weatherData || null);
      }
    } catch (err) {
      console.error("Error loading weather forecast", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Weather information currently unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Current conditions */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft grid md:grid-cols-2 gap-6 items-center">
        <div>
          <span className="eyebrow bg-blue-50 text-blue-700 border-0">Current Conditions</span>
          <h3 className="text-3xl font-extrabold text-foreground mt-3">{weather.current?.temp}°C</h3>
          <p className="text-sm font-semibold text-muted-foreground mt-1">{weather.current?.condition} | Region: {weather.location}</p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
            <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-bold mt-0.5">{weather.current?.humidity}%</p>
            </div>
            <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
              <p className="text-muted-foreground">Wind</p>
              <p className="font-bold mt-0.5">{weather.current?.windSpeed} km/h</p>
            </div>
            <div className="p-2.5 bg-muted/20 border border-border rounded-xl">
              <p className="text-muted-foreground">Pincode</p>
              <p className="font-bold mt-0.5">{weather.current?.pincode}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1"><CloudSun className="h-4 w-4" /> Rainfall Forecast</p>
          <p className="text-xs text-blue-900 leading-relaxed font-semibold">{weather.current?.rainForecast}</p>
          <div className="pt-2 border-t border-blue-100/50">
            <p className="text-[10px] text-muted-foreground">Weekly Advisory Advice:</p>
            <p className="text-[11px] font-medium text-foreground mt-1">Avoid chemical fertilizer application within 2 hours of forecasted showers to prevent surface runoff washing inputs.</p>
          </div>
        </div>
      </div>

      {/* 5-day Forecast */}
      {weather.forecast && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
          <h4 className="font-bold text-sm text-foreground">Weekly Forecast Schedule</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {weather.forecast.map((f: any, idx: number) => (
              <div key={idx} className="p-3 bg-muted/10 border border-border rounded-xl space-y-2">
                <p className="font-bold text-xs text-muted-foreground">{f.day}</p>
                <p className="text-lg font-extrabold text-foreground">{f.temp}°C</p>
                <p className="text-[9px] font-semibold text-brand">{f.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisory Alerts */}
      {weather.alerts?.map((alert: any, idx: number) => (
        <div key={idx} className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs text-warning-foreground">{alert.title}</h4>
            <p className="text-[11px] leading-relaxed text-warning-foreground mt-1">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
