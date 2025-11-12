import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';
import { WeatherService } from '../../core/services/weather.service';

type SoilType = 'urbano' | 'rustico' | 'mixto' | 'industrial';
type OwnershipType = 'individual' | 'comunidad' | 'sociedad';

interface Property {
  id: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  propertyRegistry: string; // Registro de la propiedad (ej: "Registro nº 1")
  soilType: SoilType;
  area: number; // Metros cuadrados
  owners: string[]; // Propietarios actuales
  ownershipType: OwnershipType;
  charges: string[]; // Cargas (hipotecas, embargos, etc.)
  buildability: number; // Edificabilidad (m² construibles)
  blockHash?: string;
  blockNumber?: number;
  isRegistry: boolean; // Si es un registro de la propiedad (líder)
  hasDiscrepancy?: boolean; // Si hay discrepancias entre lo que firma el notario y los datos reales
  discrepancies?: {
    field: string;
    notaryValue: string;
    registryValue: string;
  }[]; // Detalles de las discrepancias
}

@Component({
  selector: 'app-notary-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notary-simulation.component.html',
})
export class NotarySimulationComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private readonly updateInterval = 10000; // 10 segundos
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private readonly weatherService = inject(WeatherService);

  // 20 Registros de la Propiedad (líderes/bookkeepers) distribuidos en España
  private readonly propertyRegistries = [
    { name: 'Registro nº 1', city: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Registro nº 2', city: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Registro nº 3', city: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { name: 'Registro nº 4', city: 'Sevilla', lat: 37.3891, lng: -5.9845 },
    { name: 'Registro nº 5', city: 'Bilbao', lat: 43.2627, lng: -2.9253 },
    { name: 'Registro nº 6', city: 'Málaga', lat: 36.7213, lng: -4.4214 },
    { name: 'Registro nº 7', city: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { name: 'Registro nº 8', city: 'Murcia', lat: 37.9922, lng: -1.1307 },
    { name: 'Registro nº 9', city: 'Valladolid', lat: 41.6523, lng: -4.7245 },
    { name: 'Registro nº 10', city: 'Córdoba', lat: 37.8882, lng: -4.7794 },
    { name: 'Registro nº 11', city: 'Alicante', lat: 38.3452, lng: -0.4810 },
    { name: 'Registro nº 12', city: 'Granada', lat: 37.1773, lng: -3.5986 },
    { name: 'Registro nº 13', city: 'Vigo', lat: 42.2406, lng: -8.7207 },
    { name: 'Registro nº 14', city: 'Gijón', lat: 43.5322, lng: -5.6611 },
    { name: 'Registro nº 15', city: 'Palma', lat: 39.5696, lng: 2.6502 },
    { name: 'Registro nº 16', city: 'Santander', lat: 43.4623, lng: -3.8099 },
    { name: 'Registro nº 17', city: 'Toledo', lat: 39.8628, lng: -4.0273 },
    { name: 'Registro nº 18', city: 'Salamanca', lat: 40.9701, lng: -5.6635 },
    { name: 'Registro nº 19', city: 'León', lat: 42.5987, lng: -5.5671 },
    { name: 'Registro nº 20', city: 'Badajoz', lat: 38.8794, lng: -6.9707 },
  ];

  // Lista de localidades españolas para distribuir los 500 inmuebles
  private readonly spanishLocalities = [
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
    { name: 'Almería', lat: 36.8381, lng: -2.4597 },
    { name: 'Cádiz', lat: 36.5270, lng: -6.2886 },
    { name: 'Huelva', lat: 37.2574, lng: -6.9498 },
    { name: 'Jaén', lat: 37.7796, lng: -3.7849 },
    { name: 'Algeciras', lat: 36.1408, lng: -5.4565 },
    { name: 'Marbella', lat: 36.5102, lng: -4.8860 },
    { name: 'Jerez', lat: 36.6866, lng: -6.1370 },
    { name: 'Huesca', lat: 42.1361, lng: -0.4087 },
    { name: 'Teruel', lat: 40.3458, lng: -1.1065 },
    { name: 'Oviedo', lat: 43.3619, lng: -5.8494 },
    { name: 'Avilés', lat: 43.5547, lng: -5.9244 },
    { name: 'Torrelavega', lat: 43.3500, lng: -4.0500 },
    { name: 'Albacete', lat: 38.9956, lng: -1.8558 },
    { name: 'Ciudad Real', lat: 38.9863, lng: -3.9291 },
    { name: 'Cuenca', lat: 40.0718, lng: -2.1340 },
    { name: 'Guadalajara', lat: 40.6286, lng: -3.1618 },
    { name: 'Talavera', lat: 39.9635, lng: -4.8308 },
    { name: 'Ávila', lat: 40.6564, lng: -4.7004 },
    { name: 'Burgos', lat: 42.3439, lng: -3.6969 },
    { name: 'Palencia', lat: 42.0096, lng: -4.5241 },
    { name: 'Segovia', lat: 40.9429, lng: -4.1088 },
    { name: 'Soria', lat: 41.7640, lng: -2.4688 },
    { name: 'Zamora', lat: 41.5036, lng: -5.7438 },
    { name: 'Girona', lat: 41.9794, lng: 2.8214 },
    { name: 'Lleida', lat: 41.6176, lng: 0.6200 },
    { name: 'Tarragona', lat: 41.1189, lng: 1.2445 },
    { name: 'Badalona', lat: 41.4500, lng: 2.2472 },
    { name: 'Sabadell', lat: 41.5433, lng: 2.1094 },
    { name: 'Terrassa', lat: 41.5639, lng: 2.0083 },
    { name: 'Castellón', lat: 39.9864, lng: -0.0513 },
    { name: 'Elche', lat: 38.2660, lng: -0.6980 },
    { name: 'Torrevieja', lat: 37.9780, lng: -0.6820 },
    { name: 'Cáceres', lat: 39.4753, lng: -6.3724 },
    { name: 'Mérida', lat: 38.9160, lng: -6.3437 },
    { name: 'A Coruña', lat: 43.3623, lng: -8.4115 },
    { name: 'Lugo', lat: 43.0097, lng: -7.5560 },
    { name: 'Ourense', lat: 42.3360, lng: -7.8642 },
    { name: 'Pontevedra', lat: 42.4310, lng: -8.6444 },
    { name: 'Santiago', lat: 42.8782, lng: -8.5448 },
    { name: 'Móstoles', lat: 40.3228, lng: -3.8644 },
    { name: 'Alcalá de Henares', lat: 40.4818, lng: -3.3635 },
    { name: 'Fuenlabrada', lat: 40.2842, lng: -3.7946 },
    { name: 'Leganés', lat: 40.3272, lng: -3.7636 },
    { name: 'Getafe', lat: 40.3057, lng: -3.7329 },
    { name: 'Cartagena', lat: 37.6000, lng: -0.9864 },
    { name: 'Lorca', lat: 37.6710, lng: -1.7017 },
    { name: 'Pamplona', lat: 42.8125, lng: -1.6458 },
    { name: 'Vitoria', lat: 42.8467, lng: -2.6716 },
    { name: 'San Sebastián', lat: 43.3183, lng: -1.9812 },
    { name: 'Logroño', lat: 42.4650, lng: -2.4458 },
  ];

  readonly properties = signal<Property[]>([]);
  readonly registries = computed(() => this.properties().filter(p => p.isRegistry));
  readonly regularProperties = computed(() => this.properties().filter(p => !p.isRegistry));
  readonly totalProperties = computed(() => this.regularProperties().length); // Solo inmuebles regulares (500), excluyendo registros
  readonly propertiesWithCharges = computed(() => 
    this.regularProperties().filter(p => p.charges.length > 0) // Solo inmuebles regulares con cargas
  );
  readonly propertiesWithDiscrepancies = computed(() => 
    this.regularProperties().filter(p => p.hasDiscrepancy === true) // Inmuebles con discrepancias (5 casos)
  );
  readonly propertiesWithoutDiscrepancies = computed(() => 
    this.regularProperties().filter(p => !p.hasDiscrepancy) // Inmuebles sin discrepancias (495 casos)
  );

  // Nombres de propietarios simulados
  private readonly ownerNames = [
    'Juan García López', 'María Fernández Martínez', 'Carlos Rodríguez Sánchez',
    'Ana López González', 'Pedro Martínez Ruiz', 'Laura Sánchez Pérez',
    'Miguel González Torres', 'Carmen Ruiz Díaz', 'José Díaz Moreno',
    'Isabel Moreno Jiménez', 'Francisco Jiménez Navarro', 'Rosa Navarro Martín',
    'Antonio Martín Gómez', 'Pilar Gómez Serrano', 'Manuel Serrano Romero',
    'Teresa Romero Suárez', 'Javier Suárez Alonso', 'Elena Alonso Castro',
    'David Castro Ortega', 'Sandra Ortega Delgado'
  ];

  // Tipos de cargas
  private readonly chargeTypes = [
    'Hipoteca bancaria',
    'Embargo judicial',
    'Servidumbre de paso',
    'Derecho de usufructo',
    'Anotación preventiva',
    'Hipoteca subordinada',
    'Carga fiscal',
    'Derecho de superficie'
  ];

  ngOnInit(): void {
    this.initializeProperties();
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
    // Inicializar el mapa con zoom menos sensible
    this.map = L.map('notary-map', {
      zoomDelta: 0.5, // Incremento más pequeño al usar botones +/- o teclado
      zoomSnap: 0.5, // Snap más fino para niveles de zoom
      wheelPxPerZoomLevel: 120, // Más píxeles necesarios para cambiar nivel (por defecto es 60)
    }).setView([40.0, -3.0], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => this.addMarkers(), 100);
  }

  private addMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    this.properties().forEach(property => {
      const color = this.getMarkerColor(property);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color}; width:${property.isRegistry ? '16' : '12'}px; height:${property.isRegistry ? '16' : '12'}px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [property.isRegistry ? 16 : 12, property.isRegistry ? 16 : 12],
        iconAnchor: [property.isRegistry ? 8 : 6, property.isRegistry ? 8 : 6]
      });

      const marker = L.marker([property.latitude, property.longitude], { icon });
      marker.bindPopup(this.createPopupContent(property));
      marker.addTo(this.map);
      this.markers.push(marker);
    });
  }

  private getMarkerColor(property: Property): string {
    if (property.isRegistry) {
      return '#10b981'; // emerald-500 (verde) - Registros
    }
    if (property.hasDiscrepancy) {
      return '#f59e0b'; // amber-500 (amarillo/naranja) - Con discrepancias
    }
    if (property.charges.length > 0) {
      return '#ef4444'; // rose-500 (rojo) - Con cargas
    }
    return '#3b82f6'; // blue-500 (azul) - Sin cargas ni discrepancias
  }

  private createPopupContent(property: Property): string {
    // Para registros de la propiedad, mostrar solo número y dirección
    if (property.isRegistry) {
      // Extraer el número del ID (ej: "REG-001" -> "001" o solo el número)
      const registryNumber = property.id.replace('REG-', '');
      return `<div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #059669;">Registro ${registryNumber}</h3>
        <div style="font-size: 14px; color: #111827;">${property.address}</div>
      </div>`;
    }

    // Para inmuebles regulares, mostrar toda la información
    let content = `<div style="min-width: 250px;">
      <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #111827;">${property.address}</h3>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${property.city}</div>
      <div style="display: grid; gap: 4px; font-size: 13px;">
        <div><strong>Registro:</strong> ${property.propertyRegistry}</div>
        <div><strong>Tipo de suelo:</strong> <span style="text-transform: capitalize;">${property.soilType}</span></div>
        <div><strong>Metros:</strong> ${this.formatNumber(property.area)} m²</div>
        <div><strong>Edificabilidad:</strong> ${this.formatNumber(property.buildability)} m²</div>
        <div><strong>Propietario(s):</strong> ${property.owners.join(', ')}</div>
        <div><strong>Tipo propiedad:</strong> <span style="text-transform: capitalize;">${property.ownershipType}</span></div>`;

    // Mostrar discrepancias si existen
    if (property.hasDiscrepancy && property.discrepancies && property.discrepancies.length > 0) {
      content += `
        <div style="margin-top: 8px; padding: 8px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 4px;">
          <div style="font-size: 11px; color: #92400e; font-weight: 600; margin-bottom: 6px;">⚠️ DISCREPANCIA DETECTADA:</div>`;
      property.discrepancies.forEach(discrepancy => {
        content += `
          <div style="margin-bottom: 6px; padding: 4px; background: white; border-radius: 3px;">
            <div style="font-size: 10px; font-weight: 600; color: #92400e; margin-bottom: 2px;">${discrepancy.field}:</div>
            <div style="font-size: 10px; color: #dc2626;">📝 Notario: ${discrepancy.notaryValue}</div>
            <div style="font-size: 10px; color: #059669;">✅ Registro: ${discrepancy.registryValue}</div>
          </div>`;
      });
      content += `</div>`;
    }

    if (property.charges.length > 0) {
      content += `
        <div style="margin-top: 8px; padding: 6px; background: #fef2f2; border-radius: 4px;">
          <div style="font-size: 11px; color: #dc2626; font-weight: 600; margin-bottom: 4px;">⚠️ Cargas registradas:</div>
          <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #dc2626;">
            ${property.charges.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>`;
    }

    if (property.blockHash && property.blockNumber) {
      const blockchainColor = property.isRegistry ? '#059669' : '#3b82f6';
      content += `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">📋 Trazabilidad Blockchain ${property.isRegistry ? '(Registro)' : ''}</div>
          <div style="font-family: monospace; font-size: 11px; color: ${blockchainColor};" title="${property.blockHash}"><strong>Hash:</strong> ${this.formatHash(property.blockHash)}</div>
          <div style="font-size: 11px; color: ${blockchainColor};"><strong>Bloque:</strong> #${property.blockNumber}</div>
        </div>`;
    }

    content += `</div></div>`;
    return content;
  }

  private initializeProperties(): void {
    const properties: Property[] = [];
    let propertyIndex = 0;
    let blockNumber = 2000; // Número de bloque inicial (diferente de paneles solares)

    // Crear 20 Registros de la Propiedad (líderes)
    for (const registry of this.propertyRegistries) {
      const blockHash = this.generateBlockHash(registry.name, blockNumber);

      properties.push({
        id: `REG-${String(propertyIndex + 1).padStart(3, '0')}`,
        address: registry.name,
        city: registry.city,
        latitude: registry.lat,
        longitude: registry.lng,
        propertyRegistry: registry.name,
        soilType: 'urbano',
        area: 500 + Math.random() * 500, // 500-1000 m²
        owners: ['Registro de la Propiedad'],
        ownershipType: 'individual',
        charges: [],
        buildability: 0,
        blockHash: blockHash,
        blockNumber: blockNumber,
        isRegistry: true,
      });
      propertyIndex++;
      blockNumber += Math.floor(Math.random() * 50) + 10;
    }

    // Crear 500 inmuebles distribuidos en localidades españolas
    // Los primeros 5 tendrán discrepancias, los otros 495 coincidirán
    for (let i = 0; i < 500; i++) {
      const localityIndex = i % this.spanishLocalities.length;
      const locality = this.spanishLocalities[localityIndex];
      
      // Asignar a un registro aleatorio
      const assignedRegistry = this.propertyRegistries[Math.floor(Math.random() * this.propertyRegistries.length)];

      // Generar dirección simulada
      const streetTypes = ['Calle', 'Avenida', 'Plaza', 'Paseo', 'Camino'];
      const streetNames = ['Mayor', 'Real', 'Nueva', 'San Juan', 'Sol', 'Luna', 'Mar', 'Montaña', 'Río', 'Valle'];
      const streetNumber = Math.floor(Math.random() * 200) + 1;
      const address = `${streetTypes[Math.floor(Math.random() * streetTypes.length)]} ${streetNames[Math.floor(Math.random() * streetNames.length)]}, ${streetNumber}`;

      // Tipo de suelo
      const soilTypes: SoilType[] = ['urbano', 'rustico', 'mixto', 'industrial'];
      const soilType = soilTypes[Math.floor(Math.random() * soilTypes.length)];

      // Metros cuadrados según tipo de suelo
      let area: number;
      if (soilType === 'urbano') {
        area = 50 + Math.random() * 200; // 50-250 m²
      } else if (soilType === 'rustico') {
        area = 500 + Math.random() * 5000; // 500-5500 m²
      } else if (soilType === 'industrial') {
        area = 200 + Math.random() * 800; // 200-1000 m²
      } else {
        area = 100 + Math.random() * 400; // 100-500 m²
      }

      // Propietarios
      const ownershipTypes: OwnershipType[] = ['individual', 'comunidad', 'sociedad'];
      const ownershipType = ownershipTypes[Math.floor(Math.random() * ownershipTypes.length)];
      let owners: string[];
      if (ownershipType === 'individual') {
        owners = [this.ownerNames[Math.floor(Math.random() * this.ownerNames.length)]];
      } else if (ownershipType === 'comunidad') {
        const numOwners = 2 + Math.floor(Math.random() * 4); // 2-5 propietarios
        owners = [];
        const availableOwners = [...this.ownerNames];
        for (let j = 0; j < numOwners && availableOwners.length > 0; j++) {
          const idx = Math.floor(Math.random() * availableOwners.length);
          owners.push(availableOwners.splice(idx, 1)[0]);
        }
      } else {
        owners = [`Sociedad ${this.ownerNames[Math.floor(Math.random() * this.ownerNames.length)].split(' ')[0]} S.L.`];
      }

      // Cargas (30% de probabilidad de tener cargas)
      const charges: string[] = [];
      if (Math.random() < 0.3) {
        const numCharges = 1 + Math.floor(Math.random() * 3); // 1-3 cargas
        const availableCharges = [...this.chargeTypes];
        for (let j = 0; j < numCharges && availableCharges.length > 0; j++) {
          const idx = Math.floor(Math.random() * availableCharges.length);
          charges.push(availableCharges.splice(idx, 1)[0]);
        }
      }

      // Edificabilidad (todos excepto rústico)
      let buildability = 0;
      if (soilType === 'rustico') {
        buildability = 0; // Suelo rústico no tiene edificabilidad
      } else if (soilType === 'urbano' || soilType === 'mixto') {
        buildability = area * (1.5 + Math.random() * 1.5); // 1.5x a 3x el área
      } else if (soilType === 'industrial') {
        buildability = area * (0.8 + Math.random() * 0.7); // 0.8x a 1.5x el área (menor que urbano)
      }

      const blockHash = this.generateBlockHash(address, blockNumber);

      // Determinar si tiene discrepancias (solo los primeros 5)
      const hasDiscrepancy = i < 5;
      const discrepancies: { field: string; notaryValue: string; registryValue: string }[] = [];

      if (hasDiscrepancy) {
        // Crear discrepancias específicas para cada uno de los 5 casos
        switch (i) {
          case 0:
            // Discrepancia en tipo de suelo
            discrepancies.push({
              field: 'Tipo de suelo',
              notaryValue: 'urbano',
              registryValue: soilType
            });
            break;
          case 1:
            // Discrepancia en metros cuadrados
            const notaryArea = Math.round(area * 1.2); // Notario dice 20% más
            discrepancies.push({
              field: 'Metros cuadrados',
              notaryValue: `${this.formatNumber(notaryArea)} m²`,
              registryValue: `${this.formatNumber(Math.round(area))} m²`
            });
            break;
          case 2:
            // Discrepancia en propietarios
            const differentOwner = this.ownerNames.find(name => !owners.includes(name)) || this.ownerNames[0];
            discrepancies.push({
              field: 'Propietario(s)',
              notaryValue: differentOwner,
              registryValue: owners.join(', ')
            });
            break;
          case 3:
            // Discrepancia en cargas (notario no ve una carga que existe)
            if (charges.length > 0) {
              discrepancies.push({
                field: 'Cargas',
                notaryValue: 'Sin cargas',
                registryValue: charges.join(', ')
              });
            } else {
              // O notario ve una carga que no existe
              discrepancies.push({
                field: 'Cargas',
                notaryValue: 'Hipoteca bancaria',
                registryValue: 'Sin cargas'
              });
            }
            break;
          case 4:
            // Discrepancia en edificabilidad
            const notaryBuildability = Math.round(buildability * 1.3); // Notario dice 30% más
            discrepancies.push({
              field: 'Edificabilidad',
              notaryValue: `${this.formatNumber(notaryBuildability)} m²`,
              registryValue: `${this.formatNumber(Math.round(buildability))} m²`
            });
            break;
        }
      }

      properties.push({
        id: `PROP-${String(propertyIndex + 1).padStart(3, '0')}`,
        address: address,
        city: locality.name,
        latitude: locality.lat + (Math.random() - 0.5) * 0.1, // Pequeña variación
        longitude: locality.lng + (Math.random() - 0.5) * 0.1,
        propertyRegistry: assignedRegistry.name,
        soilType: soilType,
        area: Math.round(area),
        owners: owners,
        ownershipType: ownershipType,
        charges: charges,
        buildability: Math.round(buildability),
        blockHash: blockHash,
        blockNumber: blockNumber,
        isRegistry: false,
        hasDiscrepancy: hasDiscrepancy,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      });
      propertyIndex++;
      blockNumber += Math.floor(Math.random() * 50) + 10;
    }

    this.properties.set(properties);
  }

  private generateBlockHash(address: string, blockNumber: number): string {
    const seed = `${address}-${blockNumber}-${Date.now()}`;
    let hash = '';
    for (let i = 0; i < 64; i++) {
      const charCode = seed.charCodeAt(i % seed.length) + blockNumber + i;
      hash += (charCode % 16).toString(16);
    }
    return '0x' + hash;
  }

  formatHash(hash: string | undefined): string {
    if (!hash) return '-';
    if (hash.length <= 12) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: 0,
    }).format(value);
  }
}
