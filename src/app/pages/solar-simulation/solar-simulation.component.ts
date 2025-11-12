import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';

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

  // Otras ciudades para distribuir paneles normales
  private readonly otherCities = [
    { name: 'Alicante', lat: 38.3452, lng: -0.4810 },
    { name: 'Granada', lat: 37.1773, lng: -3.5986 },
    { name: 'Vigo', lat: 42.2406, lng: -8.7207 },
    { name: 'Gijón', lat: 43.5322, lng: -5.6611 },
    { name: 'Palma', lat: 39.5696, lng: 2.6502 },
    { name: 'Santander', lat: 43.4623, lng: -3.8099 },
    { name: 'Toledo', lat: 39.8628, lng: -4.0273 },
    { name: 'Salamanca', lat: 40.9701, lng: -5.6635 },
    { name: 'León', lat: 42.5987, lng: -5.5671 },
    { name: 'Badajoz', lat: 38.8794, lng: -6.9707 },
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
    // Inicializar el mapa centrado en España
    this.map = L.map('solar-map').setView([40.0, -3.0], 6);

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
    let content = `<div style="min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">${panel.name}</h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">ID: ${panel.id}</div>
      <div style="display: grid; gap: 4px; font-size: 13px;">
        <div><strong>Producción:</strong> ${this.formatNumber(panel.production)} kWh</div>
        <div><strong>Capacidad:</strong> ${this.formatNumber(panel.capacity)} kWp</div>
        <div><strong>Eficiencia:</strong> ${this.formatNumber(panel.efficiency)}%</div>
        <div><strong>Ubicación:</strong> ${this.formatNumber(panel.latitude)}, ${this.formatNumber(panel.longitude)}</div>`;

    if (panel.isLeader && panel.blockHash && panel.blockNumber) {
      content += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">📋 Trazabilidad Blockchain</div>
          <div style="font-family: monospace; font-size: 11px; color: #059669;"><strong>Hash:</strong> ${this.formatHash(panel.blockHash)}</div>
          <div style="font-size: 11px; color: #059669;"><strong>Bloque:</strong> #${panel.blockNumber}</div>
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

  private initializePanels(): void {
    const panels: SolarPanel[] = [];
    let panelIndex = 0;
    let blockNumber = 1000; // Número de bloque inicial

    // Crear 10 paneles líderes en las capitales de provincia
    for (const capital of this.leaderCapitals) {
      const capacity = 300 + Math.random() * 200; // 300-500 kWp para líderes
      const baseEfficiency = 0.90 + Math.random() * 0.10; // 90-100% eficiencia
      
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

    // Crear 90 paneles normales distribuidos cerca de las capitales y otras ciudades
    const allCities = [...this.leaderCapitals, ...this.otherCities];
    const panelsPerCity = Math.floor(90 / allCities.length);
    const remainingPanels = 90 % allCities.length;

    for (let cityIndex = 0; cityIndex < allCities.length; cityIndex++) {
      const city = allCities[cityIndex];
      const panelsToCreate = panelsPerCity + (cityIndex < remainingPanels ? 1 : 0);

      for (let i = 0; i < panelsToCreate; i++) {
        // Distribuir paneles en un radio de 50-150 km alrededor de la ciudad
        const angle = Math.random() * 2 * Math.PI;
        const distance = 50 + Math.random() * 100; // 50-150 km
        
        // Convertir distancia en grados (aproximadamente)
        const latOffset = (distance / 111) * Math.cos(angle);
        const lngOffset = (distance / (111 * Math.cos(city.lat * Math.PI / 180))) * Math.sin(angle);
        
        const lat = city.lat + latOffset;
        const lng = city.lng + lngOffset;

        const capacity = 50 + Math.random() * 450; // 50-500 kWp
        const baseEfficiency = 0.75 + Math.random() * 0.20; // 75-95% eficiencia
        
        const hourOfDay = new Date().getHours();
        const solarIntensity = this.getSolarIntensity(hourOfDay);
        const production = capacity * baseEfficiency * solarIntensity * (0.7 + Math.random() * 0.5);

        panels.push({
          id: `PANEL-${String(panelIndex + 1).padStart(3, '0')}`,
          name: `Panel ${city.name} ${i + 1}`,
          latitude: lat,
          longitude: lng,
          production: Math.max(0, production),
          capacity: capacity,
          efficiency: baseEfficiency * 100,
          isLeader: false,
          status: 'normal',
        });
        panelIndex++;
      }
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
    const solarIntensity = this.getSolarIntensity(hourOfDay);

    this.panels.update(panels =>
      panels.map(panel => {
        // Variación aleatoria en la producción
        const variation = 0.8 + Math.random() * 0.4;
        const newProduction = panel.capacity * (panel.efficiency / 100) * solarIntensity * variation;

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

