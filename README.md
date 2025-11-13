# 🚀 Votalia - Plataforma PPoV (Proof-of-Vote)

![Votalia Logo](./angular-tailwind.png)

**Votalia** es una plataforma completa de demostración del protocolo **PnV (Proof-of-Vote)**, un nuevo modelo de consenso blockchain que combina votación y prueba de participación, permitiendo que múltiples nodos generen bloques en paralelo dentro de la misma ronda de consenso.

## 📋 Tabla de Contenidos

- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🎯 Simuladores Incluidos](#-simuladores-incluidos)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [🌐 Despliegue en Vercel](#-despliegue-en-vercel)
- [📱 Responsive Design](#-responsive-design)
- [🔐 Variables de Entorno](#-variables-de-entorno)
- [📚 Estructura del Proyecto](#-estructura-del-proyecto)

---

## ✨ Características Principales

### 🔷 Protocolo PPoV (Proof-of-Vote)
- ✅ **Consenso Paralelo**: Varios bookkeepers generan bloques simultáneamente
- ✅ **Block Groups**: Usa grupos de bloques en lugar de bloques individuales
- ✅ **Escalabilidad**: Más de 350 mil tx/s en pruebas
- ✅ **Eficiencia**: Hasta 5× superior a PoV y BFT-SMART

### 📊 Panel de Control
- 📈 **Dashboard Operativo**: Visualización en tiempo real del estado de la blockchain
- 🔗 **Grupos de Bloques**: Monitoreo de block groups y transacciones
- 💳 **Transacciones**: Historial completo de transacciones
- 🌍 **Global TPS**: Simulador de demanda mundial de pagos

### 🎮 Simuladores Interactivos
- ☀️ **Simulación Paneles Solares**: 100 paneles con blockchain PPoV
- 📜 **Simulador Notaría**: 500 inmuebles con verificación distribuida
- 🗳️ **Simulador Elecciones**: Sistema completo de votación electrónica (5 fases)
- 📝 **Simulación Smart Contracts**: Contratos inteligentes ejecutables

---

## 🛠️ Tecnologías Utilizadas

- **⚡ Angular 20+**: Framework principal con TypeScript
- **🎨 Tailwind CSS v4**: Estilos utility-first
- **🗄️ Supabase**: Backend y base de datos PostgreSQL
- **📦 Vercel**: Despliegue y hosting
- **🔐 Blockchain PPoV**: Protocolo de consenso personalizado

---

## 🎯 Simuladores Incluidos

### ☀️ Simulación Paneles Solares
Sistema de monitoreo distribuido de 100 paneles solares en España. Los 10 paneles líderes actúan como bookkeepers, identificando paneles con bajo rendimiento en tiempo real.

**Características:**
- 🔋 10 Líderes (bookkeepers)
- 🔗 Trazabilidad Blockchain
- 🌤️ Datos Meteorológicos

### 📜 Simulador Notaría
Sistema de verificación inmobiliaria distribuida con 500 inmuebles y 20 registros de la propiedad. Los notarios verifican en tiempo real todos los datos del inmueble.

**Características:**
- 📋 20 Registros
- ⚡ Verificación Tiempo Real
- 🔍 Detección Discrepancias

### 🗳️ Simulador Elecciones (5 Fases)
Sistema completo de votación electrónica basado en blockchain PPoV con 5 fases:

1. **Fase 1**: Seleccionar o Crear Votante
2. **Fase 2**: Registrar Voto
3. **Fase 3**: Enviar SMS Simulado con datos encriptados
4. **Fase 4**: Resultados Totales y asignación de votos aleatorios
5. **Fase 5**: Descargar Cadena de Bloques completa

**Características:**
- 🔐 Voto Secreto
- ✅ Verificación Pública
- 🔗 Trazabilidad Completa
- 📱 SMS con encriptación SHA-256
- 📊 Resultados en tiempo real

### 📝 Simulación Smart Contracts
Plataforma para crear, desplegar y ejecutar contratos inteligentes sobre la blockchain PPoV.

**Características:**
- ⚙️ Ejecución Automática
- ✅ Verificación de Condiciones
- 🔒 Inmutabilidad

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Node.js 18.x o superior** (Node.js 20.x recomendado)
- **Angular CLI** instalado globalmente:

```bash
npm install -g @angular/cli
```

### 📥 Clonar el Repositorio

```bash
git clone https://github.com/aseran74/blockchain.git
cd blockchain/free-angular-tailwind-dashboard-main
```

### 📦 Instalar Dependencias

```bash
npm install
```

### ⚙️ Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
NG_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
NG_APP_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 🏃 Iniciar Servidor de Desarrollo

```bash
npm start
```

Luego abre: 👉 `http://localhost:4200`

---

## 🌐 Despliegue en Vercel

### 🔧 Configuración Automática

El proyecto está configurado para desplegarse automáticamente en Vercel. Ver [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) para detalles completos.

### 📝 Pasos Rápidos

1. **Conecta el repositorio** en Vercel Dashboard
2. **Configura las variables de entorno**:
   - `NG_APP_SUPABASE_URL`
   - `NG_APP_SUPABASE_ANON_KEY`
3. **Vercel detectará automáticamente**:
   - Build Command: `npm run prebuild && ng build --configuration production`
   - Output Directory: `dist/ng-tailadmin/browser`

### 🔗 URL de Producción

🌐 **Producción**: [https://votalia.vercel.app](https://votalia.vercel.app)

---

## 📱 Responsive Design

El proyecto está completamente optimizado para dispositivos móviles, tablets y escritorio:

- 📱 **Mobile First**: Diseño optimizado para móviles
- 💻 **Tablet**: Layout adaptativo para tablets
- 🖥️ **Desktop**: Experiencia completa en escritorio

### 🎨 Mejoras de Responsividad

- ✅ Grids adaptativos con `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- ✅ Botones que se adaptan al ancho disponible
- ✅ Texto responsive con tamaños escalables
- ✅ Formularios optimizados para móviles
- ✅ Tablas con scroll horizontal en móviles

---

## 🔐 Variables de Entorno

### 🔑 Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NG_APP_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxx.supabase.co` |
| `NG_APP_SUPABASE_ANON_KEY` | Clave anónima de Supabase | `eyJhbGci...` |

### 📝 Configuración Local

El script `generate-env-config.js` lee automáticamente las variables desde:
1. Variables de entorno del sistema (`process.env`)
2. Archivo `.env` en la raíz del proyecto

### 🌐 Configuración en Vercel

Configura las variables en: **Vercel Dashboard → Settings → Environment Variables**

---

## 📚 Estructura del Proyecto

```
free-angular-tailwind-dashboard-main/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 pages/
│   │   │   ├── 🏠 home/                    # Landing page
│   │   │   ├── 📊 dashboard/               # Panel principal
│   │   │   ├── 🔗 block-groups/            # Grupos de bloques
│   │   │   ├── 💳 transactions/            # Transacciones
│   │   │   ├── ☀️ solar-simulation/       # Simulación paneles solares
│   │   │   ├── 📜 notary-simulation/       # Simulador notaría
│   │   │   ├── 🗳️ election-simulation/     # Simulador elecciones (5 fases)
│   │   │   └── 📝 smart-contracts-simulation/ # Simulación smart contracts
│   │   ├── 📁 shared/                      # Componentes compartidos
│   │   └── 📁 core/                        # Servicios core
│   └── 📁 assets/
├── 📁 scripts/
│   └── 🔧 generate-env-config.js           # Generador de variables de entorno
├── 📁 public/                              # Archivos estáticos
├── ⚙️ vercel.json                          # Configuración Vercel
└── 📄 package.json                         # Dependencias
```

---

## 🎯 Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/` | 🏠 Landing page con información del protocolo PPoV |
| `/dashboard` | 📊 Panel operativo principal |
| `/block-groups` | 🔗 Grupos de bloques |
| `/transactions` | 💳 Transacciones |
| `/solar-simulation` | ☀️ Simulación paneles solares |
| `/notary-simulation` | 📜 Simulador notaría |
| `/election-simulation` | 🗳️ Simulador elecciones (5 fases) |
| `/smart-contracts-simulation` | 📝 Simulación smart contracts |
| `/global-tps` | 🌍 Proyección TPS mundial |

---

## 🔬 Investigación y Referencias

Este proyecto se basa en la investigación validada:

**📄 "PnV: An Efficient Parallel Consensus Protocol Integrating Proof and Voting"**
- Autores: Wang et al.
- Publicación: Appl. Sci. 2024, 14, 3510
- 🔗 [Enlace al paper](https://www.mdpi.com/2076-3417/14/8/3510)

### 📊 Resultados Validados

- ⚡ **350+ mil tx/s** en pruebas de rendimiento
- 📈 **5× más eficiente** que PoV y BFT-SMART
- 🏢 **4× superior** a FISCO BCOS en escenarios empresariales
- ✅ **Tolerancia a fallos** preservada con mecanismos robustos

---

## 🛠️ Scripts Disponibles

```bash
# 🚀 Iniciar servidor de desarrollo
npm start

# 🏗️ Compilar para producción
npm run build

# 👀 Compilar y observar cambios
npm run watch

# 🧪 Ejecutar tests
npm test

# 📝 Generar tipos de Supabase
npm run supabase:types
```

---

## 🐛 Solución de Problemas

### ❌ Error 404 en Rutas

Si experimentas errores 404 en producción:

1. ✅ Verifica que `vercel.json` esté configurado correctamente
2. ✅ Confirma que "Output Directory" sea `dist/ng-tailadmin/browser`
3. ✅ Promociona el deployment correcto en Vercel Dashboard

### 🔐 Variables de Entorno No Disponibles

1. ✅ Verifica que las variables estén configuradas en Vercel
2. ✅ Asegúrate de que el archivo `.env` exista en desarrollo local
3. ✅ Revisa los logs de build para confirmar que se generan correctamente

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. 🍴 Haz fork del proyecto
2. 🌿 Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push a la rama (`git push origin feature/AmazingFeature`)
5. 🔀 Abre un Pull Request

---

## 📞 Contacto y Soporte

- 🌐 **Website**: [https://votalia.vercel.app](https://votalia.vercel.app)
- 📧 **Issues**: [GitHub Issues](https://github.com/aseran74/blockchain/issues)

---

## 🎉 Agradecimientos

- 🙏 A los investigadores del protocolo PPoV
- 🎨 TailAdmin por el template base
- ⚡ Angular y Tailwind CSS por las herramientas increíbles
- 🗄️ Supabase por el backend robusto

---

**⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub!**
