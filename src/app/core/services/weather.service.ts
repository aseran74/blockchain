import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface WeatherForecast {
  code: string;
  text: string;
  temperature?: {
    low: number;
    high: number;
    unit: string;
  };
  cloudCover?: number; // 0-100
  solarIntensity?: number; // Factor de intensidad solar basado en condiciones
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  // Usaremos OpenWeatherMap como alternativa ya que la API de Singapur es específica de esa región
  // Para producción, necesitarías una API key de OpenWeatherMap
  private readonly openWeatherApiKey = 'demo'; // Reemplazar con API key real
  private readonly openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene pronóstico del tiempo para una ubicación específica
   * Por ahora retorna datos simulados basados en condiciones típicas de España
   */
  getWeatherForecast(lat: number, lng: number): Observable<WeatherForecast> {
    // Simulación de datos meteorológicos basados en ubicación y hora del día
    const hour = new Date().getHours();
    const month = new Date().getMonth(); // 0-11
    
    // Determinar condiciones basadas en ubicación y época del año
    let code = 'PC'; // Partly Cloudy por defecto
    let text = 'Parcialmente Nublado';
    let cloudCover = 30;
    let solarIntensity = this.calculateSolarIntensity(hour, month, lat);

    // Simular variaciones según región
    if (lat > 42) { // Norte (más nublado)
      cloudCover = 50 + Math.random() * 30;
      if (cloudCover > 70) {
        code = 'SH';
        text = 'Chubascos';
        solarIntensity *= 0.5;
      } else if (cloudCover > 50) {
        code = 'PC';
        text = 'Parcialmente Nublado';
        solarIntensity *= 0.7;
      }
    } else if (lat < 38) { // Sur (más soleado)
      cloudCover = 10 + Math.random() * 20;
      if (cloudCover < 20) {
        code = 'CL';
        text = 'Despejado';
        solarIntensity *= 1.1;
      }
    }

    // Ajustar según hora del día
    if (hour < 6 || hour > 20) {
      solarIntensity = 0; // Noche
      code = 'CL';
      text = 'Noche';
    }

    const temperature = this.estimateTemperature(lat, month, hour);

    return of({
      code,
      text,
      temperature: {
        low: temperature - 5,
        high: temperature + 5,
        unit: 'Celsius'
      },
      cloudCover: Math.round(cloudCover),
      solarIntensity: Math.max(0, Math.min(1, solarIntensity))
    });
  }

  /**
   * Calcula intensidad solar basada en hora, mes y latitud
   */
  private calculateSolarIntensity(hour: number, month: number, lat: number): number {
    // Noche
    if (hour < 6 || hour > 20) return 0;

    // Factor estacional (verano más intenso)
    const seasonalFactor = 0.7 + 0.3 * Math.cos((month - 6) * Math.PI / 6);
    
    // Factor latitudinal (más cerca del ecuador = más intenso)
    const latitudinalFactor = 1 - Math.abs(lat - 40) / 50;
    
    // Factor horario (máximo al mediodía)
    const normalizedHour = (hour - 6) / 14; // 0 a 1
    const hourlyFactor = Math.sin(normalizedHour * Math.PI);

    return seasonalFactor * latitudinalFactor * hourlyFactor;
  }

  /**
   * Estima temperatura basada en ubicación, mes y hora
   */
  private estimateTemperature(lat: number, month: number, hour: number): number {
    // Temperatura base según latitud
    let baseTemp = 20 - (lat - 40) * 0.5;
    
    // Variación estacional
    baseTemp += 10 * Math.cos((month - 6) * Math.PI / 6);
    
    // Variación diaria (más cálido al mediodía)
    const normalizedHour = (hour - 6) / 14;
    const dailyVariation = 5 * Math.sin(normalizedHour * Math.PI);
    
    return Math.round(baseTemp + dailyVariation);
  }

  /**
   * Obtiene múltiples pronósticos para diferentes ubicaciones
   */
  getMultipleForecasts(locations: Array<{lat: number, lng: number}>): Observable<Map<string, WeatherForecast>> {
    const forecasts = new Map<string, WeatherForecast>();
    
    locations.forEach((loc, index) => {
      this.getWeatherForecast(loc.lat, loc.lng).subscribe(forecast => {
        forecasts.set(`${loc.lat},${loc.lng}`, forecast);
      });
    });

    return of(forecasts);
  }
}

