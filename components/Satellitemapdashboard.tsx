import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Rectangle, LayersControl } from 'react-leaflet';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend
} from 'recharts';
import {
  Layers, Droplets, Sprout, AlertTriangle, Info,
  TrendingUp, CloudRain, Thermometer, Activity,
  ChevronDown, ChevronUp, Eye, EyeOff, Satellite
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────
// Types  , to paste in Satellite one 
// ─────────────────────────────────────────────────────────────
interface SatelliteData {
  ndvi: number;
  ndwi: number;
  stress: number;
  vci: number;
  smi: number;
  evi?: number;
  rainfall?: number;
  temperature?: number;
}

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
  satelliteData?: SatelliteData;
}

// ─────────────────────────────────────────────────────────────
// Tumkur District bounding box (pilot area)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Simulated pixel-grid generator
// Returns a 7×7 grid of cells covering Tumkur bbox
// Each cell carries stress / growthStage / irrigAdvisory values
// derived deterministically from NDVI so the three maps stay
// spatially consistent with each other.
// ─────────────────────────────────────────────────────────────
function buildPixelGrid(ndvi: number, stress: number) {
  const rows = 7; const cols = 7;
  const latStep = (13.95 - 13.10) / rows;
  const lngStep = (77.45 - 76.65) / cols;
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // deterministic variation per cell
      const seed = Math.sin(r * 13 + c * 7 + ndvi * 100) * 0.5 + 0.5; // 0–1
      const cellNDVI   = Math.min(1, Math.max(0, ndvi   + (seed - 0.5) * 0.35));
      const cellStress = Math.min(1, Math.max(0, stress + (seed - 0.5) * 0.30));

      // Map 1 – Stress class
      const stressClass =
        cellStress < 0.20 ? 1 :
        cellStress < 0.40 ? 2 : 3;

      // Map 2 – Growth stage (NDVI thresholds, Kharif Karnataka)
      const growthStage =
        cellNDVI < 0.15 ? 1 :
        cellNDVI < 0.30 ? 2 :
        cellNDVI < 0.50 ? 3 :
        cellNDVI < 0.65 ? 4 : 5;

      // Map 3 – Irrigation advisory (composite of stress + low-NDWI proxy)
      const irrigNeed = cellStress * 0.6 + (1 - cellNDVI) * 0.4;
      const irrigTier =
        irrigNeed < 0.25 ? 1 :
        irrigNeed < 0.45 ? 2 :
        irrigNeed < 0.65 ? 3 : 4;

      const latMin = 13.10 + r * latStep;
      const lngMin = 76.65 + c * lngStep;
      cells.push({
        bounds: [[latMin, lngMin], [latMin + latStep, lngMin + lngStep]] as [[number,number],[number,number]],
        stressClass,
        growthStage,
        irrigTier,
        cellNDVI: +cellNDVI.toFixed(3),
        cellStress: +cellStress.toFixed(3),
      });
    }
  }
  return cells;
}

// ─────────────────────────────────────────────────────────────
// Colour maps
// ─────────────────────────────────────────────────────────────
const STRESS_COLORS  = ['', '#2ecc40', '#f4d03f', '#e74c3c'];
const STRESS_LABELS  = ['', 'Healthy', 'Moderate Stress', 'High Stress'];

const STAGE_COLORS   = ['', '#d4c5a9', '#f9e547', '#5bba6f', '#1f7a3d', '#8B4513'];
const STAGE_LABELS   = ['', 'Bare / Fallow', 'Germination', 'Vegetative', 'Flowering', 'Maturity'];

const IRRIG_COLORS   = ['', '#2196F3', '#8BC34A', '#FF9800', '#F44336'];
const IRRIG_LABELS   = ['', 'No Action', 'Monitor', 'Schedule', 'Irrigate Now'];

// ─────────────────────────────────────────────────────────────
// Time-series mock data  (Kharif 2024, monthly)
// In production these come from the GEE /api/location endpoint
// ─────────────────────────────────────────────────────────────
function buildTimeSeries(ndvi: number) {
  // Typical Kharif NDVI arc: rises Jun→Sep, drops Oct→Nov
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov'];
  const ndviArc = [0.12, 0.28, 0.45, 0.62, 0.58, 0.42, 0.25];
  const rainArc = [18,   82,  120,  98,   65,   22,   8];
  const sarArc  = [-18, -14, -12,  -11,  -13,  -16,  -19];

  const offset = ndvi - 0.45;
  return months.map((m, i) => ({
    month: m,
    ndvi:  +(Math.min(1, Math.max(0, ndviArc[i] + offset))).toFixed(3),
    rainfall: rainArc[i],
    sar: sarArc[i],
  }));
}

// ─────────────────────────────────────────────────────────────
// Legend component
// ─────────────────────────────────────────────────────────────
const MapLegend: React.FC<{
  title: string;
  items: { color: string; label: string }[];
  icon: React.ReactNode;
}> = ({ title, items, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center mb-3">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center space-x-2">
          <span
            className="w-4 h-4 rounded-sm shrink-0 border border-black/10"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-700 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Stat chip
// ─────────────────────────────────────────────────────────────
const StatChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm min-w-[72px]">
    <span className={`text-base font-bold ${color}`}>{value}</span>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const SatelliteMapDashboard: React.FC<Props> = ({ location,longitude,latitude,satelliteData }) => {

  const MAP_CENTER: [number, number] = [
        latitude ?? 13.525,
        longitude ?? 77.05
        ];

        const MAP_BOUNDS: [[number, number], [number, number]] = [
      [
        (latitude ?? 13.525) - 0.15,
        (longitude ?? 77.05) - 0.15
      ],
      [
        (latitude ?? 13.525) + 0.15,
        (longitude ?? 77.05) + 0.15
      ]
    ];

  // active map layer toggle
  const [activeMap, setActiveMap] = useState<'stress' | 'growth' | 'irrig'>('stress');
  const [showTimeSeries, setShowTimeSeries] = useState(true);

  const sd: SatelliteData = satelliteData ?? {
    ndvi: 0.48, ndwi: 0.12, stress: 0.31,
    vci: 48, smi: 55, evi: 0.39,
    rainfall: 412, temperature: 28.4,
  };

  const cells    = buildPixelGrid(sd.ndvi, sd.stress);
  const tsData   = buildTimeSeries(sd.ndvi);

  // District-level advisory text
  const districtAdvisory =
    sd.stress > 0.45
      ? { text: 'CRITICAL – High moisture stress. Irrigate within 24 h.', color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
      : sd.stress > 0.25
      ? { text: 'CAUTION – Moderate stress detected. Schedule irrigation soon.', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
      : { text: 'STABLE – Moisture levels adequate. Monitor weekly.', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };

  const growthLabel =
    sd.ndvi < 0.15 ? 'Bare / Fallow' :
    sd.ndvi < 0.30 ? 'Germination' :
    sd.ndvi < 0.50 ? 'Vegetative Growth' :
    sd.ndvi < 0.65 ? 'Flowering / Podding' : 'Maturity / Ripening';

  // Cell colour for active layer
  const cellColor = (cell: ReturnType<typeof buildPixelGrid>[0]) =>
    activeMap === 'stress'
      ? STRESS_COLORS[cell.stressClass]
      : activeMap === 'growth'
      ? STAGE_COLORS[cell.growthStage]
      : IRRIG_COLORS[cell.irrigTier];

  const cellLabel = (cell: ReturnType<typeof buildPixelGrid>[0]) =>
    activeMap === 'stress'
      ? STRESS_LABELS[cell.stressClass]
      : activeMap === 'growth'
      ? STAGE_LABELS[cell.growthStage]
      : IRRIG_LABELS[cell.irrigTier];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 flex items-center">
            <Satellite className="w-7 h-7 mr-2 text-emerald-600" />
            Satellite Crop Monitoring
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Tumkur District, Karnataka · Kharif 2024 · Sentinel-2 + Sentinel-1 SAR
          </p>
        </div>

        {/* Stat ribbon */}
        <div className="flex flex-wrap gap-2">
          <StatChip label="NDVI"    value={sd.ndvi.toFixed(2)}    color="text-emerald-600" />
          <StatChip label="NDWI"    value={sd.ndwi.toFixed(2)}    color="text-blue-600"    />
          <StatChip label="Stress"  value={sd.stress.toFixed(2)}  color="text-amber-600"   />
          <StatChip label="Rain mm" value={sd.rainfall ? Math.round(sd.rainfall).toString() : '—'} color="text-sky-600" />
          <StatChip label="Temp °C" value={sd.temperature ? sd.temperature.toFixed(1) : '—'} color="text-orange-500" />
        </div>
      </div>

      {/* ── District advisory banner ── */}
      <div className={`flex items-start space-x-3 p-4 rounded-2xl border ${districtAdvisory.bg}`}>
        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${districtAdvisory.color}`} />
        <div>
          <p className={`text-sm font-bold ${districtAdvisory.color}`}>{districtAdvisory.text}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            District growth stage: <span className="font-semibold text-gray-700">{growthLabel}</span>
            {location ? ` · Location: ${location}` : ''}
          </p>
        </div>
      </div>

      {/* ── Map Layer Selector ── */}
      <div className="flex space-x-2">
        {[
          { id: 'stress' as const, label: 'MAP - Location Specific Rough Regional Boundary  ',     icon: <Activity className="w-4 h-4" /> }
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveMap(id)}
            className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeMap === id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {icon}
            <span className="hidden md:inline">{label}</span>
            <span className="inline md:hidden">{label.split(' – ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ── Main grid: Map + Legends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Map canvas */}
        <div className="lg:col-span-3 rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative">
          {/* Map title overlay */}
          <div className="absolute top-3 left-3 z-[999] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-gray-800">
              {activeMap === 'stress' ? 'Moisture Stress Classification' :
               activeMap === 'growth' ? 'Crop Growth Stage' :
               'Pixel-level Irrigation Advisory'}
            </span>
          </div>

          <MapContainer
            key={activeMap}
            center={MAP_CENTER}
            zoom={9}
            style={{ height: '520px', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={0.4}
            />

            {/* District boundary */}
            <Rectangle
              bounds={MAP_BOUNDS}
              pathOptions={{ color: '#1a1a2e', weight: 2.5, fillOpacity: 0, dashArray: '6 4' }}
            /> 

            {/* Pixel grid for active layer 
            {cells.map((cell, idx) => (
              <Rectangle
                key={`${activeMap}-${idx}`}
                bounds={cell.bounds}
                pathOptions={{
                  color: 'rgba(0,0,0,0.08)',
                  weight: 0.5,
                  fillColor: cellColor(cell),
                  fillOpacity: 0.72,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[160px]">
                    <p className="font-bold text-gray-800 border-b pb-1 mb-1">Pixel Analysis</p>
                    <p><span className="text-gray-500">NDVI:</span> <strong>{cell.cellNDVI}</strong></p>
                    <p><span className="text-gray-500">Stress Index:</span> <strong>{cell.cellStress}</strong></p>
                    <p><span className="text-gray-500">Stress Class:</span>
                      <strong style={{ color: STRESS_COLORS[cell.stressClass] }}> {STRESS_LABELS[cell.stressClass]}</strong>
                    </p>
                    <p><span className="text-gray-500">Growth Stage:</span>
                      <strong style={{ color: STAGE_COLORS[cell.growthStage] }}> {STAGE_LABELS[cell.growthStage]}</strong>
                    </p>
                    <p><span className="text-gray-500">Advisory:</span>
                      <strong style={{ color: IRRIG_COLORS[cell.irrigTier] }}> {IRRIG_LABELS[cell.irrigTier]}</strong>
                    </p>
                  </div>
                </Popup>
              </Rectangle>
            ))}   */}
          </MapContainer>

          {/* Source badge */}
          <div className="absolute bottom-3 right-3 z-[999] bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest">
            Sentinel-2 SR · SAR VV · CHIRPS
          </div>
        </div>

        {/* Legend panel */}
        <div className="space-y-4">
          <MapLegend
            title="MAP 1 – Stress"
            icon={<Activity className="w-3.5 h-3.5 text-amber-500" />}
            items={STRESS_LABELS.slice(1).map((l, i) => ({ color: STRESS_COLORS[i+1], label: l }))}
          />
          <MapLegend
            title="MAP 2 – Growth"
            icon={<Sprout className="w-3.5 h-3.5 text-emerald-600" />}
            items={STAGE_LABELS.slice(1).map((l, i) => ({ color: STAGE_COLORS[i+1], label: l }))}
          />
          <MapLegend
            title="MAP 3 – Advisory"
            icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />}
            items={IRRIG_LABELS.slice(1).map((l, i) => ({ color: IRRIG_COLORS[i+1], label: l }))}
          />

          {/* Quick stat box */}
          <div className="bg-emerald-900 text-white rounded-2xl p-4 space-y-2 shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              District Summary
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-200">Dominant Stage</span>
                <span className="font-bold">{growthLabel.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">VCI</span>
                <span className="font-bold">{sd.vci}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">SMI</span>
                <span className="font-bold">{sd.smi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">Season</span>
                <span className="font-bold">Kharif 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Three map stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Map 1 stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mb-3">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> MAP 1 · Stress Breakdown
          </h3>
          {[
            { label: 'Healthy', pct: Math.round((1 - sd.stress) * 65), color: '#2ecc40' },
            { label: 'Moderate',pct: Math.round(sd.stress * 55),       color: '#f4d03f' },
            { label: 'High',    pct: Math.round(sd.stress * 45),       color: '#e74c3c' },
          ].map(({ label, pct, color }) => (
            <div key={label} className="mb-2">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-bold" style={{ color }}>~{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Map 2 stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mb-3">
            <Sprout className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> MAP 2 · Stage Distribution
          </h3>
          {STAGE_LABELS.slice(1).map((label, i) => {
            // approximate area % from NDVI
            const ndviBucket = sd.ndvi;
            const pcts = [8, 12, 35, 30, 15]; // typical Kharif Tumkur breakdown
            const offset = Math.round((ndviBucket - 0.45) * 40);
            const pct = Math.max(2, pcts[i] + (i === 2 ? offset : i === 3 ? -offset/2 : 0));
            return (
              <div key={label} className="mb-2">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold" style={{ color: STAGE_COLORS[i+1] }}>~{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[i+1] }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Map 3 stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mb-3">
            <Droplets className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> MAP 3 · Advisory Tiers
          </h3>
          {IRRIG_LABELS.slice(1).map((label, i) => {
            const tierPcts = [35, 28, 22, 15];
            const stressOffset = Math.round((sd.stress - 0.3) * 60);
            const adjusted = [
              Math.max(5, tierPcts[0] - stressOffset),
              Math.max(5, tierPcts[1]),
              Math.max(5, tierPcts[2] + stressOffset / 2),
              Math.max(5, tierPcts[3] + stressOffset / 2),
            ];
            return (
              <div key={label} className="mb-2">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold" style={{ color: IRRIG_COLORS[i+1] }}>~{adjusted[i]}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${adjusted[i]}%`, backgroundColor: IRRIG_COLORS[i+1] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

     
     

      {/* ── Data source footer ── */}
      <div className="flex flex-wrap gap-2 justify-end text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {['Sentinel-2 SR', 'Sentinel-1 GRD SAR', 'CHIRPS Rainfall', 'MODIS LST', 'Google Earth Engine'].map(s => (
          <span key={s} className="px-2 py-1 bg-gray-100 rounded-lg">{s}</span>
        ))}
      </div>
    </div>
  );
};

export default SatelliteMapDashboard;