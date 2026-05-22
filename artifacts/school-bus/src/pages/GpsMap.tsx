import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Bus, Users, Navigation, Activity, Wifi, WifiOff, Clock, MapPin,
  ChevronRight, Play, Pause, AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react";

/* ── Sri Lanka school bus routes ─────────────────────────────────── */

type LatLng = [number, number];

interface RouteDefinition {
  id: string;
  label: string;
  busNumber: string;
  driver: string;
  students: number;
  capacity: number;
  color: string;
  school: string;
  region: string;
  waypoints: LatLng[];
  speed: number; // waypoints per tick
}

const ROUTES: RouteDefinition[] = [
  {
    id: "bus-1",
    label: "Colombo City Route",
    busNumber: "SB-001",
    driver: "Nimal Perera",
    students: 38,
    capacity: 45,
    color: "#F59E0B",
    school: "Royal College, Colombo",
    region: "Western Province",
    speed: 0.012,
    waypoints: [
      [6.9271, 79.8612],
      [6.9185, 79.8650],
      [6.9050, 79.8620],
      [6.8900, 79.8660],
      [6.8742, 79.8750],
      [6.8580, 79.8870],
      [6.8440, 79.8978],
      [6.8262, 79.9112],
      [6.8099, 79.9175],
    ],
  },
  {
    id: "bus-2",
    label: "Kandy Central Route",
    busNumber: "SB-002",
    driver: "Karunasena Silva",
    students: 32,
    capacity: 40,
    color: "#3B82F6",
    school: "Dharmaraja College, Kandy",
    region: "Central Province",
    speed: 0.010,
    waypoints: [
      [7.2906, 80.6337],
      [7.3020, 80.6380],
      [7.3095, 80.6420],
      [7.3145, 80.5892],
      [7.2780, 80.5870],
      [7.2578, 80.5933],
      [7.2480, 80.6200],
      [7.2389, 80.6232],
    ],
  },
  {
    id: "bus-3",
    label: "Galle Southern Route",
    busNumber: "SB-003",
    driver: "Ranjith Fernando",
    students: 29,
    capacity: 40,
    color: "#10B981",
    school: "Richmond College, Galle",
    region: "Southern Province",
    speed: 0.008,
    waypoints: [
      [6.0535, 80.2210],
      [6.0923, 80.1782],
      [6.1393, 80.1016],
      [6.1650, 80.0680],
      [6.2020, 80.0430],
      [6.2293, 80.0573],
      [6.2820, 80.0068],
      [6.3200, 79.9800],
    ],
  },
  {
    id: "bus-4",
    label: "Negombo Northern Route",
    busNumber: "SB-004",
    driver: "Sunil Jayawardena",
    students: 41,
    capacity: 45,
    color: "#8B5CF6",
    school: "St. Mary's College, Negombo",
    region: "North Western Province",
    speed: 0.009,
    waypoints: [
      [7.2083, 79.8358],
      [7.1900, 79.8500],
      [7.1700, 79.8700],
      [7.1500, 79.8877],
      [7.1200, 79.9050],
      [7.0917, 79.9083],
      [7.0700, 79.9400],
      [7.0500, 79.9800],
    ],
  },
  {
    id: "bus-5",
    label: "Kurunegala NW Route",
    busNumber: "SB-005",
    driver: "Pradeep Dissanayake",
    students: 35,
    capacity: 40,
    color: "#EF4444",
    school: "Maliyadeva College, Kurunegala",
    region: "North Western Province",
    speed: 0.011,
    waypoints: [
      [7.4818, 80.3609],
      [7.5000, 80.3400],
      [7.5143, 80.2908],
      [7.5350, 80.2600],
      [7.5637, 80.2349],
      [7.5900, 80.2100],
      [7.6138, 80.1992],
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function interpolatePosition(waypoints: LatLng[], progress: number): LatLng {
  const max = waypoints.length - 1;
  const clamped = Math.max(0, Math.min(progress, max));
  const i = Math.floor(clamped);
  const t = clamped - i;
  if (i >= max) return waypoints[max];
  const a = waypoints[i];
  const b = waypoints[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function bearing(a: LatLng, b: LatLng): number {
  const dLng = b[1] - a[1];
  const dLat = b[0] - a[0];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function busIcon(color: string, rotation: number, isSelected: boolean) {
  const size = isSelected ? 44 : 36;
  const ring = isSelected ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color};` : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.35);
        ${ring}
        transform:rotate(${rotation}deg);
        transition:transform 0.3s;
      ">
        <svg viewBox="0 0 24 24" width="${Math.round(size * 0.52)}" height="${Math.round(size * 0.52)}" fill="white">
          <path d="M17 20H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1H3V8c0-2.21 3.58-4 8-4s8 1.79 8 4v12h-1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zm1-7H6v4h12v-4zm0-5H6v4h12V8zM8 17.5a1 1 0 110-2 1 1 0 010 2zm8 0a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </div>
    `,
  });
}

function schoolIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;background:${color};border-radius:3px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
  });
}

/* ── Map focus helper component ──────────────────────────────────── */
function FocusView({ pos, zoom }: { pos: LatLng | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, zoom, { duration: 1.2 });
  }, [pos, zoom, map]);
  return null;
}

/* ── Main component ──────────────────────────────────────────────── */
interface BusState {
  id: string;
  progress: number;
  direction: 1 | -1;
  pos: LatLng;
  rotation: number;
  status: "moving" | "stopped" | "arrived";
}

const ACCENT = "#F59E0B";
const BORDER = "#E2E8F0";
const MUTED = "#64748B";
const HEAD = "#0F172A";

export default function GpsMap() {
  const [busStates, setBusStates] = useState<BusState[]>(() =>
    ROUTES.map((r, i) => ({
      id: r.id,
      progress: (i * 1.5) % (r.waypoints.length - 1),
      direction: 1,
      pos: r.waypoints[0],
      rotation: 0,
      status: "moving" as const,
    }))
  );
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusPos, setFocusPos] = useState<LatLng | null>(null);
  const [focusZoom, setFocusZoom] = useState(8);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setBusStates(prev =>
      prev.map((state, i) => {
        const route = ROUTES[i];
        const max = route.waypoints.length - 1;
        let newProgress = state.progress + route.speed * state.direction;
        let newDirection = state.direction;
        if (newProgress >= max) { newProgress = max; newDirection = -1; }
        else if (newProgress <= 0) { newProgress = 0; newDirection = 1; }
        const pos = interpolatePosition(route.waypoints, newProgress);
        const nextP = interpolatePosition(route.waypoints, newProgress + 0.01 * newDirection);
        const rot = bearing(pos, nextP);
        const status: BusState["status"] =
          newProgress >= max || newProgress <= 0 ? "arrived" : "moving";
        return { ...state, progress: newProgress, direction: newDirection, pos, rotation: rot, status };
      })
    );
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(tick, 80);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, tick]);

  const focusBus = (id: string) => {
    setSelected(id);
    const state = busStates.find(s => s.id === id);
    if (state) { setFocusPos(state.pos); setFocusZoom(13); }
  };

  const focusAll = () => {
    setSelected(null);
    setFocusPos([7.8731, 80.7718]);
    setFocusZoom(8);
  };

  const totalStudents = ROUTES.reduce((s, r) => s + r.students, 0);
  const movingBuses = busStates.filter(b => b.status === "moving").length;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", gap: 0, margin: "-28px -32px 0", overflow: "hidden" }}>

      {/* ── Left panel ── */}
      <div
        style={{
          width: 300,
          background: "#fff",
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: HEAD }}>GPS Tracker</h2>
              <p className="text-xs mt-0.5 font-medium" style={{ color: MUTED }}>Sri Lanka — Live simulation</p>
            </div>
            <button
              onClick={() => setPlaying(v => !v)}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
              style={playing
                ? { background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0" }
                : { background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" }
              }
              title={playing ? "Pause simulation" : "Resume simulation"}
            >
              {playing ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active buses", value: `${movingBuses}/${ROUTES.length}`, icon: Bus, color: ACCENT },
              { label: "Students on board", value: totalStudents, icon: Users, color: "#3B82F6" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon style={{ width: 11, height: 11, color }} />
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
                </div>
                <p className="text-lg font-black" style={{ color: HEAD }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* "Show all" button */}
        <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <button
            onClick={focusAll}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-semibold transition-colors"
            style={!selected
              ? { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }
              : { background: "#F8FAFC", color: MUTED, border: `1px solid ${BORDER}` }
            }
          >
            <Navigation style={{ width: 12, height: 12 }} />
            Show all Sri Lanka
          </button>
        </div>

        {/* Bus list */}
        <div className="flex-1 overflow-y-auto">
          {ROUTES.map((route, i) => {
            const state = busStates[i];
            const isActive = selected === route.id;
            const pct = Math.round((state.progress / (route.waypoints.length - 1)) * 100);
            const dir = state.direction === 1 ? "Outbound" : "Returning";

            return (
              <button
                key={route.id}
                onClick={() => isActive ? focusAll() : focusBus(route.id)}
                className="w-full text-left px-4 py-4 transition-colors"
                style={{
                  borderBottom: `1px solid ${BORDER}`,
                  background: isActive ? "#FFFBEB" : "#fff",
                  borderLeft: isActive ? `3px solid ${route.color}` : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                <div className="flex items-start gap-3">
                  {/* Bus color dot */}
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: route.color }}
                  >
                    <Bus style={{ width: 14, height: 14, color: "#fff" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: HEAD }}>{route.busNumber}</p>
                      <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: state.status === "moving" ? "#15803D" : "#92400E" }}>
                        {state.status === "moving"
                          ? <><span className="relative flex h-1.5 w-1.5 mr-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#16A34A" }} />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>Moving</>
                          : <><AlertCircle style={{ width: 10, height: 10 }} />Stopped</>
                        }
                      </div>
                    </div>

                    <p className="text-xs mt-0.5 font-medium truncate" style={{ color: MUTED }}>{route.school}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: "#94A3B8" }}>{route.region}</p>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{dir}</span>
                        <span className="text-[10px] font-bold" style={{ color: route.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full" style={{ background: "#F1F5F9" }}>
                        <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: route.color }} />
                      </div>
                    </div>

                    {/* Driver & students */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        👤 {route.driver.split(" ")[0]}
                      </span>
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        🎒 {route.students}/{route.capacity}
                      </span>
                    </div>
                  </div>

                  <ChevronRight style={{ width: 13, height: 13, color: "#CBD5E1", flexShrink: 0, marginTop: 4 }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}>
          <RefreshCw style={{ width: 11, height: 11, color: ACCENT, animation: playing ? "spin 2s linear infinite" : "none" }} />
          <span className="text-[11px] font-medium" style={{ color: MUTED }}>
            {playing ? "Simulation running" : "Simulation paused"}
          </span>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>DEMO</span>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[7.8731, 80.7718]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FocusView pos={focusPos} zoom={focusZoom} />

          {ROUTES.map((route, i) => {
            const state = busStates[i];
            const isSelected = selected === route.id;

            return (
              <div key={route.id}>
                {/* Route line */}
                <Polyline
                  positions={route.waypoints}
                  pathOptions={{
                    color: route.color,
                    weight: isSelected ? 5 : 3,
                    opacity: isSelected ? 0.9 : 0.5,
                    dashArray: "8, 4",
                  }}
                />

                {/* Start/end markers */}
                <Marker position={route.waypoints[0]} icon={schoolIcon(route.color)}>
                  <Popup>
                    <div className="text-sm font-semibold">{route.school}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{route.region}</div>
                  </Popup>
                </Marker>

                {/* Bus marker */}
                <Marker
                  position={state.pos}
                  icon={busIcon(route.color, state.rotation, isSelected)}
                  eventHandlers={{ click: () => focusBus(route.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: route.color }}>
                          <Bus style={{ width: 14, height: 14, color: "#fff" }} />
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: HEAD }}>{route.busNumber}</p>
                          <p className="text-xs" style={{ color: MUTED }}>{route.label}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs" style={{ color: MUTED }}>
                        <p>🏫 {route.school}</p>
                        <p>👤 {route.driver}</p>
                        <p>🎒 {route.students}/{route.capacity} students</p>
                        <p>📍 {route.region}</p>
                        <p style={{ color: state.status === "moving" ? "#15803D" : "#92400E" }}>
                          {state.status === "moving" ? "● Moving" : "■ Stopped"}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {/* Map overlay legend */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 12,
            zIndex: 1000,
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            minWidth: 180,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>Bus Routes</p>
          <div className="space-y-1.5">
            {ROUTES.map((r) => (
              <button
                key={r.id}
                onClick={() => selected === r.id ? focusAll() : focusBus(r.id)}
                className="flex items-center gap-2 w-full text-left"
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                <span className="text-xs font-semibold" style={{ color: selected === r.id ? r.color : HEAD }}>{r.busNumber}</span>
                <span className="text-[11px] truncate" style={{ color: MUTED }}>{r.region.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected bus detail overlay */}
        {selected && (() => {
          const route = ROUTES.find(r => r.id === selected)!;
          const state = busStates.find(s => s.id === selected)!;
          const pct = Math.round((state.progress / (route.waypoints.length - 1)) * 100);
          return (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 1000,
                background: "rgba(255,255,255,0.97)",
                border: `2px solid ${route.color}`,
                borderRadius: 16,
                padding: "14px 16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                minWidth: 240,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: route.color }}>
                  <Bus style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div>
                  <p className="font-black text-base" style={{ color: HEAD }}>{route.busNumber}</p>
                  <p className="text-xs font-medium" style={{ color: MUTED }}>{route.school}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin style={{ width: 13, height: 13, color: MUTED }} />
                  <span style={{ color: MUTED }}>{route.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users style={{ width: 13, height: 13, color: MUTED }} />
                  <span style={{ color: MUTED }}>{route.students} / {route.capacity} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity style={{ width: 13, height: 13, color: state.status === "moving" ? "#15803D" : "#92400E" }} />
                  <span style={{ color: state.status === "moving" ? "#15803D" : "#92400E", fontWeight: 600 }}>
                    {state.direction === 1 ? "Outbound" : "Returning"} · {pct}%
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full rounded-full" style={{ background: "#F1F5F9" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: route.color }} />
                </div>
              </div>
              <button
                onClick={focusAll}
                className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg transition-colors"
                style={{ background: "#F8FAFC", color: MUTED, border: `1px solid ${BORDER}` }}
              >
                ← Back to all buses
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
