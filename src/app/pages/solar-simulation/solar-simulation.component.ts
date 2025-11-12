import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';
import { WeatherService, WeatherForecast } from '../../core/services/weather.service';

interface SolarPanel {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  production: number; // kWh
  capacity: number; // kWp
  efficiency: number; // porcentaje
  isLeader: boolean;
  status: 'normal' | 'low-performance';
  distanceToNearestLeader?: number;
  leaderId?: string;
  blockHash?: string; // Hash del bloque blockchain
  blockNumber?: number; // Número de bloque en la blockchain
}

@Component({
  selector: 'app-solar-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solar-simulation.component.html',
})
export class SolarSimulationComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private readonly updateInterval = 5000; // 5 segundos
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private readonly weatherService = inject(WeatherService);
  private weatherCache = new Map<string, WeatherForecast>();
  
  // Límites aproximados de España continental (excluyendo islas y mar)
  private readonly spainBounds = {
    minLat: 36.0,
    maxLat: 43.8,
    minLng: -9.3,
    maxLng: 4.3,
    // Áreas marítimas a excluir (coordenadas aproximadas) - Más estricto
    maritimeZones: [
      // Océano Atlántico al oeste (más amplio)
      { minLat: 36.0, maxLat: 43.8, minLng: -9.3, maxLng: -6.5 },
      // Mar Mediterráneo al este (más amplio)
      { minLat: 36.0, maxLat: 38.5, minLng: -0.3, maxLng: 4.3 },
      { minLat: 40.0, maxLat: 43.8, minLng: 1.5, maxLng: 4.3 },
      // Costa norte (Cantábrico)
      { minLat: 43.0, maxLat: 43.8, minLng: -5.0, maxLng: -1.5 },
      // Costa sur (Mediterráneo)
      { minLat: 36.0, maxLat: 37.5, minLng: -6.0, maxLng: -0.3 },
    ]
  };

  // 10 capitales de provincia españolas (paneles líderes)
  private readonly leaderCapitals = [
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
    { name: 'Bilbao', lat: 43.2627, lng: -2.9253 },
    { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
    { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
    { name: 'Valladolid', lat: 41.6523, lng: -4.7245 },
    { name: 'Córdoba', lat: 37.8882, lng: -4.7794 },
  ];

  // 90 localidades españolas reales para los paneles normales (garantiza que estén en tierra)
  private readonly spanishLocalities = [
    // Andalucía
    { name: 'Almería', lat: 36.8381, lng: -2.4597 },
    { name: 'Cádiz', lat: 36.5270, lng: -6.2886 },
    { name: 'Córdoba', lat: 37.8882, lng: -4.7794 },
    { name: 'Granada', lat: 37.1773, lng: -3.5986 },
    { name: 'Huelva', lat: 37.2574, lng: -6.9498 },
    { name: 'Jaén', lat: 37.7796, lng: -3.7849 },
    { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
    { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
    { name: 'Algeciras', lat: 36.1408, lng: -5.4565 },
    { name: 'Marbella', lat: 36.5102, lng: -4.8860 },
    { name: 'Jerez', lat: 36.6866, lng: -6.1370 },
    { name: 'Dos Hermanas', lat: 37.2833, lng: -5.9208 },
    { name: 'Alcalá de Guadaíra', lat: 37.3386, lng: -5.8500 },
    
    // Aragón
    { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { name: 'Huesca', lat: 42.1361, lng: -0.4087 },
    { name: 'Teruel', lat: 40.3458, lng: -1.1065 },
    { name: 'Calatayud', lat: 41.3533, lng: -1.6433 },
    
    // Asturias
    { name: 'Oviedo', lat: 43.3619, lng: -5.8494 },
    { name: 'Gijón', lat: 43.5322, lng: -5.6611 },
    { name: 'Avilés', lat: 43.5547, lng: -5.9244 },
    
    // Baleares
    { name: 'Palma', lat: 39.5696, lng: 2.6502 },
    { name: 'Ibiza', lat: 38.9067, lng: 1.4206 },
    
    // Canarias (solo algunas principales)
    { name: 'Las Palmas', lat: 28.1248, lng: -15.4300 },
    { name: 'Santa Cruz de Tenerife', lat: 28.4636, lng: -16.2518 },
    
    // Cantabria
    { name: 'Santander', lat: 43.4623, lng: -3.8099 },
    { name: 'Torrelavega', lat: 43.3500, lng: -4.0500 },
    
    // Castilla-La Mancha
    { name: 'Albacete', lat: 38.9956, lng: -1.8558 },
    { name: 'Ciudad Real', lat: 38.9863, lng: -3.9291 },
    { name: 'Cuenca', lat: 40.0718, lng: -2.1340 },
    { name: 'Guadalajara', lat: 40.6286, lng: -3.1618 },
    { name: 'Toledo', lat: 39.8628, lng: -4.0273 },
    { name: 'Talavera de la Reina', lat: 39.9635, lng: -4.8308 },
    { name: 'Puertollano', lat: 38.6871, lng: -4.1073 },
    
    // Castilla y León
    { name: 'Ávila', lat: 40.6564, lng: -4.7004 },
    { name: 'Burgos', lat: 42.3439, lng: -3.6969 },
    { name: 'León', lat: 42.5987, lng: -5.5671 },
    { name: 'Palencia', lat: 42.0096, lng: -4.5241 },
    { name: 'Salamanca', lat: 40.9701, lng: -5.6635 },
    { name: 'Segovia', lat: 40.9429, lng: -4.1088 },
    { name: 'Soria', lat: 41.7640, lng: -2.4688 },
    { name: 'Valladolid', lat: 41.6523, lng: -4.7245 },
    { name: 'Zamora', lat: 41.5036, lng: -5.7438 },
    { name: 'Aranda de Duero', lat: 41.6700, lng: -3.6900 },
    { name: 'Miranda de Ebro', lat: 42.6867, lng: -2.9492 },
    
    // Cataluña
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Girona', lat: 41.9794, lng: 2.8214 },
    { name: 'Lleida', lat: 41.6176, lng: 0.6200 },
    { name: 'Tarragona', lat: 41.1189, lng: 1.2445 },
    { name: 'Badalona', lat: 41.4500, lng: 2.2472 },
    { name: 'Sabadell', lat: 41.5433, lng: 2.1094 },
    { name: 'Terrassa', lat: 41.5639, lng: 2.0083 },
    { name: 'L\'Hospitalet', lat: 41.3597, lng: 2.1003 },
    { name: 'Santa Coloma', lat: 41.4515, lng: 2.2600 },
    { name: 'Mataró', lat: 41.5381, lng: 2.4447 },
    { name: 'Reus', lat: 41.1569, lng: 1.1069 },
    { name: 'Manresa', lat: 41.7250, lng: 1.8264 },
    
    // Comunidad Valenciana
    { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { name: 'Alicante', lat: 38.3452, lng: -0.4810 },
    { name: 'Castellón', lat: 39.9864, lng: -0.0513 },
    { name: 'Elche', lat: 38.2660, lng: -0.6980 },
    { name: 'Torrevieja', lat: 37.9780, lng: -0.6820 },
    { name: 'Orihuela', lat: 38.0850, lng: -0.9440 },
    { name: 'Gandía', lat: 38.9667, lng: -0.1833 },
    { name: 'Torrent', lat: 39.4375, lng: -0.4653 },
    { name: 'Paterna', lat: 39.5028, lng: -0.4406 },
    
    // Extremadura
    { name: 'Badajoz', lat: 38.8794, lng: -6.9707 },
    { name: 'Cáceres', lat: 39.4753, lng: -6.3724 },
    { name: 'Mérida', lat: 38.9160, lng: -6.3437 },
    { name: 'Plasencia', lat: 40.0300, lng: -6.0900 },
    
    // Galicia
    { name: 'A Coruña', lat: 43.3623, lng: -8.4115 },
    { name: 'Lugo', lat: 43.0097, lng: -7.5560 },
    { name: 'Ourense', lat: 42.3360, lng: -7.8642 },
    { name: 'Pontevedra', lat: 42.4310, lng: -8.6444 },
    { name: 'Vigo', lat: 42.2406, lng: -8.7207 },
    { name: 'Santiago', lat: 42.8782, lng: -8.5448 },
    { name: 'Ferrol', lat: 43.4833, lng: -8.2333 },
    
    // Madrid
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Móstoles', lat: 40.3228, lng: -3.8644 },
    { name: 'Alcalá de Henares', lat: 40.4818, lng: -3.3635 },
    { name: 'Fuenlabrada', lat: 40.2842, lng: -3.7946 },
    { name: 'Leganés', lat: 40.3272, lng: -3.7636 },
    { name: 'Getafe', lat: 40.3057, lng: -3.7329 },
    { name: 'Alcorcón', lat: 40.3494, lng: -3.8247 },
    
    // Murcia
    { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
    { name: 'Cartagena', lat: 37.6000, lng: -0.9864 },
    { name: 'Lorca', lat: 37.6710, lng: -1.7017 },
    
    // Navarra
    { name: 'Pamplona', lat: 42.8125, lng: -1.6458 },
    { name: 'Tudela', lat: 42.0619, lng: -1.6044 },
    
    // País Vasco
    { name: 'Bilbao', lat: 43.2627, lng: -2.9253 },
    { name: 'Vitoria', lat: 42.8467, lng: -2.6716 },
    { name: 'San Sebastián', lat: 43.3183, lng: -1.9812 },
    { name: 'Barakaldo', lat: 43.2975, lng: -2.9858 },
    { name: 'Getxo', lat: 43.3444, lng: -3.0069 },
    
    // La Rioja
    { name: 'Logroño', lat: 42.4650, lng: -2.4458 },
    { name: 'Calahorra', lat: 42.3031, lng: -1.9650 },
  ];

  readonly panels = signal<SolarPanel[]>([]);
  readonly leaders = computed(() => this.panels().filter(p => p.isLeader));
  readonly lowPerformancePanels = computed(() => 
    this.panels().filter(p => p.status === 'low-performance')
  );
  readonly totalProduction = computed(() =>
    this.panels().reduce((sum, p) => sum + p.production, 0)
  );
  readonly averageEfficiency = computed(() => {
    const panels = this.panels();
    if (panels.length === 0) return 0;
    return panels.reduce((sum, p) => sum + p.efficiency, 0) / panels.length;
  });

  ngOnInit(): void {
    this.initializePanels();
    this.startSimulation();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Inicializar el mapa centrado en España con zoom menos sensible
    this.map = L.map('solar-map', {
      zoomDelta: 0.5, // Incremento más pequeño al usar botones +/- o teclado
      zoomSnap: 0.5, // Snap más fino para niveles de zoom
      wheelPxPerZoomLevel: 120, // Más píxeles necesarios para cambiar nivel (por defecto es 60)
    }).setView([40.0, -3.0], 6);

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Agregar marcadores después de que el mapa esté inicializado
    setTimeout(() => this.addMarkers(), 100);
  }

  private addMarkers(): void {
    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    this.panels().forEach(panel => {
      const color = this.getMarkerColor(panel);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color}; width:${panel.isLeader ? '16' : '12'}px; height:${panel.isLeader ? '16' : '12'}px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [panel.isLeader ? 16 : 12, panel.isLeader ? 16 : 12],
        iconAnchor: [panel.isLeader ? 8 : 6, panel.isLeader ? 8 : 6]
      });

      const marker = L.marker([panel.latitude, panel.longitude], { icon });

      // Crear popup con información del panel
      const popupContent = this.createPopupContent(panel);
      marker.bindPopup(popupContent);
      marker.addTo(this.map);
      this.markers.push(marker);
    });
  }

  private getMarkerColor(panel: SolarPanel): string {
    if (panel.isLeader) {
      return '#10b981'; // emerald-500 (verde)
    }
    if (panel.status === 'low-performance') {
      return '#ef4444'; // rose-500 (rojo)
    }
    return '#3b82f6'; // blue-500 (azul)
  }

  private createPopupContent(panel: SolarPanel): string {
    const weatherKey = `${panel.latitude},${panel.longitude}`;
    const weather = this.weatherCache.get(weatherKey);

    let content = `<div style="min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">${panel.name}</h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">ID: ${panel.id}</div>
      <div style="display: grid; gap: 4px; font-size: 13px;">
        <div><strong>Producción:</strong> ${this.formatNumber(panel.production)} kWh</div>
        <div><strong>Capacidad:</strong> ${this.formatNumber(panel.capacity)} kWp</div>
        <div><strong>Eficiencia:</strong> ${this.formatNumber(panel.efficiency)}%</div>
        <div><strong>Ubicación:</strong> ${this.formatNumber(panel.latitude)}, ${this.formatNumber(panel.longitude)}</div>`;

    // Información meteorológica
    if (weather) {
      content += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">🌤️ Condiciones Meteorológicas</div>
          <div style="font-size: 12px;"><strong>Estado:</strong> ${weather.text}</div>`;
      if (weather.temperature) {
        content += `<div style="font-size: 12px;"><strong>Temperatura:</strong> ${weather.temperature.low}°C - ${weather.temperature.high}°C</div>`;
      }
      if (weather.cloudCover !== undefined) {
        content += `<div style="font-size: 12px;"><strong>Nubosidad:</strong> ${weather.cloudCover}%</div>`;
      }
      content += `</div>`;
    }

    // Trazabilidad Blockchain (todos los paneles tienen blockchain)
    if (panel.blockHash && panel.blockNumber) {
      const blockchainColor = panel.isLeader ? '#059669' : '#3b82f6';
      content += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">📋 Trazabilidad Blockchain ${panel.isLeader ? '(Líder)' : ''}</div>
          <div style="font-family: monospace; font-size: 11px; color: ${blockchainColor};" title="${panel.blockHash}"><strong>Hash:</strong> ${this.formatHash(panel.blockHash)}</div>
          <div style="font-size: 11px; color: ${blockchainColor};"><strong>Bloque:</strong> #${panel.blockNumber}</div>
        </div>`;
    }

    if (panel.status === 'low-performance' && panel.distanceToNearestLeader) {
      content += `
        <div style="margin-top: 8px; padding: 6px; background: #fef2f2; border-radius: 4px; font-size: 11px; color: #dc2626;">
          ⚠️ Bajo rendimiento detectado<br>
          Distancia al líder: ${this.formatNumber(panel.distanceToNearestLeader)} km
        </div>`;
    }

    content += `</div></div>`;
    return content;
  }

  /**
   * Valida si unas coordenadas están en tierra (dentro de España continental)
   * Validación más estricta para evitar paneles en el mar
   */
  private isOnLand(lat: number, lng: number): boolean {
    // Verificar límites generales
    if (lat < this.spainBounds.minLat || lat > this.spainBounds.maxLat ||
        lng < this.spainBounds.minLng || lng > this.spainBounds.maxLng) {
      return false;
    }

    // EXCLUSIONES ESTRICTAS DE ZONAS MARÍTIMAS
    
    // 1. Océano Atlántico al oeste (muy estricto)
    if (lng < -7.5) return false;
    if (lng < -7.0 && lat < 37.0) return false; // Sur del Atlántico
    if (lng < -6.5 && lat > 43.0) return false; // Norte del Atlántico
    
    // 2. Mar Mediterráneo al este (muy estricto)
    if (lng > 3.0 && lat < 38.5) return false; // Mediterráneo sur
    if (lng > 2.5 && lat > 42.0) return false; // Mediterráneo norte
    if (lng > 1.0 && lat < 37.0) return false; // Costa mediterránea sur
    if (lng > 0.5 && lat > 40.5) return false; // Costa mediterránea norte
    
    // 3. Verificar zonas marítimas específicas
    for (const zone of this.spainBounds.maritimeZones) {
      if (lat >= zone.minLat && lat <= zone.maxLat &&
          lng >= zone.minLng && lng <= zone.maxLng) {
        return false;
      }
    }

    // 4. Excluir áreas costeras muy cercanas al mar (margen de seguridad)
    // Costa atlántica oeste
    if (lng < -6.8 && lat < 37.5) return false;
    if (lng < -6.5 && lat > 42.5) return false;
    
    // Costa mediterránea este
    if (lng > 2.8 && lat < 38.0) return false;
    if (lng > 2.2 && lat > 41.5) return false;
    
    // Costa sur (Cádiz, Málaga)
    if (lat < 36.5 && lng < -4.5) return false;
    if (lat < 37.0 && lng > -0.5) return false;
    
    // Costa norte (Cantábrico) - Muy estricto
    if (lat > 43.2 && lng < -2.0) return false;
    if (lat > 43.5 && lng > -1.0) return false;
    
    // Zona norte de Bilbao (mar Cantábrico) - Exclusión específica
    if (lat > 43.3 && lng > -3.5 && lng < -1.5) return false; // Norte de Bilbao
    if (lat > 43.25 && lng > -3.0 && lng < -2.5) return false; // Área inmediatamente al norte de Bilbao
    
    // Zona norte de Gijón y Asturias (mar Cantábrico) - Exclusión específica
    if (lat > 43.5) return false; // Cualquier cosa al norte de 43.5 está en el mar o muy cerca
    if (lat > 43.4 && lng > -6.5 && lng < -4.5) return false; // Zona de Gijón/Asturias
    if (lat > 43.35 && lng > -6.0 && lng < -5.0) return false; // Área específica de Gijón

    // 5. Validación adicional: asegurar que esté en el interior de la península
    // Áreas claramente marítimas
    if (lng < -8.0) return false; // Océano Atlántico profundo
    if (lng > 3.8) return false; // Mar Mediterráneo profundo
    if (lat < 36.2) return false; // Sur extremo (cerca de África)
    if (lat > 43.5) return false; // Norte extremo - NUNCA permitir lat > 43.5 (mar Cantábrico)
    
    // Exclusión adicional para zona de Gijón/Santander (coordenadas específicas del problema)
    if (lat > 43.4 && lng > -6.0 && lng < -5.0) return false; // Gijón y alrededores
    if (lat > 43.3 && lng > -4.5 && lng < -3.0) return false; // Santander y alrededores

    // 6. Validar que esté en una zona claramente terrestre (margen de seguridad)
    // Solo permitir coordenadas que estén claramente en el interior
    // Excluir zona norte de Bilbao explícitamente
    if (lat > 43.2 && lng > -3.5 && lng < -2.0) return false; // Zona norte de Bilbao
    
    const isInland = 
      (lng > -6.0 && lng < 2.0 && lat < 43.2) || // Zona central (excluyendo norte de Bilbao)
      (lng > -7.0 && lng < -6.0 && lat > 37.5 && lat < 43.0) || // Oeste interior
      (lng > 2.0 && lng < 2.5 && lat > 38.0 && lat < 41.5); // Este interior

    if (!isInland) {
      // Permitir solo si está claramente en el interior de una región conocida
      // Zonas interiores seguras
      const safeZones = [
        { minLat: 37.5, maxLat: 43.0, minLng: -6.0, maxLng: 2.0 }, // Interior peninsular (pero se excluye zona Bilbao después)
        { minLat: 39.0, maxLat: 42.0, minLng: -6.5, maxLng: -5.5 }, // Extremadura
        { minLat: 38.5, maxLat: 40.5, minLng: -5.0, maxLng: -2.0 }, // Castilla-La Mancha
        { minLat: 40.0, maxLat: 42.5, minLng: -4.0, maxLng: -1.0 }, // Castilla y León
        { minLat: 41.0, maxLat: 42.5, minLng: -3.0, maxLng: 0.0 }, // Aragón interior
        { minLat: 38.0, maxLat: 40.0, minLng: -1.0, maxLng: 1.5 }, // Comunidad Valenciana interior
      ];

      // Excluir zona norte de Bilbao de zonas seguras
      if (lat > 43.2 && lng > -3.5 && lng < -2.0) {
        return false; // Zona norte de Bilbao - siempre excluir
      }

      let inSafeZone = false;
      for (const zone of safeZones) {
        if (lat >= zone.minLat && lat <= zone.maxLat &&
            lng >= zone.minLng && lng <= zone.maxLng) {
          inSafeZone = true;
          break;
        }
      }

      if (!inSafeZone) {
        return false;
      }
    }

    return true;
  }

  private initializePanels(): void {
    const panels: SolarPanel[] = [];
    let panelIndex = 0;
    let blockNumber = 1000; // Número de bloque inicial

    // Crear 10 paneles líderes en las capitales de provincia
    for (const capital of this.leaderCapitals) {
      // Validar que la capital esté en tierra (deberían estar todas)
      if (!this.isOnLand(capital.lat, capital.lng)) {
        console.warn(`Capital ${capital.name} está fuera de tierra, ajustando coordenadas`);
        continue;
      }

      const capacity = 300 + Math.random() * 200; // 300-500 kWp para líderes
      const baseEfficiency = 0.90 + Math.random() * 0.10; // 90-100% eficiencia
      
      // Obtener pronóstico del tiempo
      const weatherKey = `${capital.lat},${capital.lng}`;
      this.weatherService.getWeatherForecast(capital.lat, capital.lng).subscribe(forecast => {
        this.weatherCache.set(weatherKey, forecast);
      });

      const hourOfDay = new Date().getHours();
      const solarIntensity = this.getSolarIntensity(hourOfDay);
      const production = capacity * baseEfficiency * solarIntensity * (0.9 + Math.random() * 0.2);

      // Generar hash blockchain simulado (64 caracteres hexadecimales)
      const blockHash = this.generateBlockHash(capital.name, blockNumber);

      panels.push({
        id: `PANEL-${String(panelIndex + 1).padStart(3, '0')}`,
        name: `Panel Líder ${capital.name}`,
        latitude: capital.lat,
        longitude: capital.lng,
        production: Math.max(0, production),
        capacity: capacity,
        efficiency: baseEfficiency * 100,
        isLeader: true,
        status: 'normal',
        blockHash: blockHash,
        blockNumber: blockNumber,
      });
      panelIndex++;
      blockNumber += Math.floor(Math.random() * 50) + 10; // Incremento variable entre bloques
    }

    // Crear 90 paneles normales usando localidades reales de España
    // Seleccionar las primeras 90 localidades (excluyendo las que ya son líderes)
    const leaderCityNames = new Set(this.leaderCapitals.map(c => c.name));
    const availableLocalities = this.spanishLocalities
      .filter(loc => !leaderCityNames.has(loc.name))
      .slice(0, 90); // Tomar las primeras 90 disponibles

    for (const locality of availableLocalities) {
      // Validar que la localidad esté en tierra (deberían estar todas, pero por seguridad)
      if (!this.isOnLand(locality.lat, locality.lng)) {
        console.warn(`Localidad ${locality.name} está fuera de tierra, omitiendo`);
        continue;
      }

      const capacity = 50 + Math.random() * 450; // 50-500 kWp
      const baseEfficiency = 0.75 + Math.random() * 0.20; // 75-95% eficiencia
      
      // Generar hash blockchain simulado (64 caracteres hexadecimales)
      const blockHash = this.generateBlockHash(locality.name, blockNumber);
      
      // Obtener pronóstico del tiempo
      const weatherKey = `${locality.lat},${locality.lng}`;
      this.weatherService.getWeatherForecast(locality.lat, locality.lng).subscribe(forecast => {
        this.weatherCache.set(weatherKey, forecast);
      });

      const hourOfDay = new Date().getHours();
      const solarIntensity = this.getSolarIntensity(hourOfDay);
      const production = capacity * baseEfficiency * solarIntensity * (0.7 + Math.random() * 0.5);

      panels.push({
        id: `PANEL-${String(panelIndex + 1).padStart(3, '0')}`,
        name: `Panel ${locality.name}`,
        latitude: locality.lat,
        longitude: locality.lng,
        production: Math.max(0, production),
        capacity: capacity,
        efficiency: baseEfficiency * 100,
        isLeader: false,
        status: 'normal',
        blockHash: blockHash,
        blockNumber: blockNumber,
      });
      panelIndex++;
      blockNumber += Math.floor(Math.random() * 50) + 10; // Incremento variable entre bloques
    }

    this.panels.set(panels);
    this.analyzePerformance();
  }

  private getSolarIntensity(hour: number): number {
    // Simula la intensidad solar durante el día (máximo al mediodía)
    if (hour < 6 || hour > 20) return 0; // Noche
    const normalizedHour = (hour - 6) / 14; // 0 a 1
    return Math.sin(normalizedHour * Math.PI);
  }

  private startSimulation(): void {
    interval(this.updateInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateProduction();
        this.analyzePerformance();
        // Actualizar marcadores en el mapa
        if (this.map) {
          this.addMarkers();
        }
      });
  }

  private updateProduction(): void {
    const hourOfDay = new Date().getHours();
    const baseSolarIntensity = this.getSolarIntensity(hourOfDay);

    this.panels.update(panels =>
      panels.map(panel => {
        // Obtener pronóstico del tiempo para este panel
        const weatherKey = `${panel.latitude},${panel.longitude}`;
        const weather = this.weatherCache.get(weatherKey);
        
        // Ajustar intensidad solar según condiciones meteorológicas
        let weatherFactor = 1.0;
        if (weather?.solarIntensity !== undefined) {
          weatherFactor = weather.solarIntensity;
        } else {
          // Si no hay datos de clima, usar factor basado en código de clima
          if (weather) {
            switch (weather.code) {
              case 'CL': // Despejado
                weatherFactor = 1.0;
                break;
              case 'PC': // Parcialmente nublado
                weatherFactor = 0.7;
                break;
              case 'SH': // Chubascos
                weatherFactor = 0.4;
                break;
              case 'TL': // Tormentas
                weatherFactor = 0.2;
                break;
              default:
                weatherFactor = 0.6;
            }
          }
        }

        // Intensidad solar ajustada por clima
        const adjustedSolarIntensity = baseSolarIntensity * weatherFactor;

        // Variación aleatoria en la producción
        const variation = 0.8 + Math.random() * 0.4;
        const newProduction = panel.capacity * (panel.efficiency / 100) * adjustedSolarIntensity * variation;

        // Simular problemas ocasionales (30% menos producción)
        const hasIssue = Math.random() < 0.15; // 15% probabilidad
        const finalProduction = hasIssue ? newProduction * 0.7 : newProduction;

        return {
          ...panel,
          production: Math.max(0, finalProduction),
        };
      })
    );
  }

  private analyzePerformance(): void {
    const leaders = this.leaders();
    
    this.panels.update(panels =>
      panels.map(panel => {
        if (panel.isLeader) {
          return { ...panel, status: 'normal' };
        }

        // Encontrar el líder más cercano
        let nearestLeader: SolarPanel | null = null;
        let minDistance = Infinity;

        for (const leader of leaders) {
          const distance = this.calculateDistance(
            panel.latitude,
            panel.longitude,
            leader.latitude,
            leader.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestLeader = leader;
          }
        }

        // Si está dentro de 100 km de un líder
        if (minDistance <= 100 && nearestLeader) {
          // Calcular producción esperada basada en el líder
          const expectedProduction = nearestLeader.production * (panel.capacity / nearestLeader.capacity);
          
          // Si produce 30% menos que lo esperado
          if (panel.production < expectedProduction * 0.7) {
            return {
              ...panel,
              status: 'low-performance',
              distanceToNearestLeader: minDistance,
              leaderId: nearestLeader.id,
            };
          }
        }

        return {
          ...panel,
          status: 'normal',
          distanceToNearestLeader: minDistance <= 100 ? minDistance : undefined,
          leaderId: minDistance <= 100 ? nearestLeader?.id : undefined,
        };
      })
    );
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Fórmula de Haversine para calcular distancia en km
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Métodos para el mapa SVG (coordenadas reales de España)
  normalizeLongitude(lng: number): number {
    // España está entre aproximadamente -9.3 y 4.3 grados de longitud
    // Normalizar a coordenadas SVG (0-1000)
    return ((lng + 9.3) / 13.6) * 1000;
  }

  normalizeLatitude(lat: number): number {
    // España está entre aproximadamente 36.0 y 43.8 grados de latitud
    // Normalizar a coordenadas SVG (0-700)
    return ((43.8 - lat) / 7.8) * 700;
  }

  getPanelColor(panel: SolarPanel): string {
    if (panel.isLeader) {
      return '#10b981'; // emerald-500
    }
    if (panel.status === 'low-performance') {
      return '#ef4444'; // rose-500
    }
    return '#3b82f6'; // blue-500
  }

  // Radio del círculo de influencia (100 km) en coordenadas SVG
  getInfluenceRadius(): number {
    // 100 km ≈ 0.9 grados de latitud
    // En el mapa normalizado: (0.9 / 7.8) * 700 ≈ 81
    return 81;
  }

  // Generar hash blockchain simulado (64 caracteres hexadecimales)
  private generateBlockHash(cityName: string, blockNumber: number): string {
    const seed = `${cityName}-${blockNumber}-${Date.now()}`;
    let hash = '';
    for (let i = 0; i < 64; i++) {
      const charCode = seed.charCodeAt(i % seed.length) + blockNumber + i;
      hash += (charCode % 16).toString(16);
    }
    return '0x' + hash;
  }

  // Formatear hash para mostrar (primeros y últimos caracteres)
  formatHash(hash: string | undefined): string {
    if (!hash) return '-';
    if (hash.length <= 12) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  }
}

