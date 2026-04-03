"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import {
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock,
  Award, CheckCircle, XCircle, Package,
  Smartphone, Laptop, Tablet, Watch, Monitor, Printer, Gamepad2,
  HardDrive, Zap, DollarSign, Activity, Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/ui/ErrorState";
import type { RepairRequestListItem } from "@/types/repairs";

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminDashboardKpi = {
  new_count: number;
  in_progress_count: number;
  ready_for_pickup_count: number;
  overdue_count: number;
  unclaimed_count: number;
  revenue_total: string;
  quote_value_total: string;
  complaints_count: number;
  warranties_count: number;
  completed_count: number;
  avg_completion_days: number | null;
};

type TimePoint = { period: string; count: number; revenue: string };

type AdminDashboardResponse = {
  period_days: number;
  kpi: AdminDashboardKpi;
  tables: {
    most_overdue: RepairRequestListItem[];
    no_quote_repairs: RepairRequestListItem[];
    unclaimed_repairs: RepairRequestListItem[];
    active_complaints: RepairRequestListItem[];
    active_warranties: RepairRequestListItem[];
    top_staff: Array<{ user_id: string; full_name: string; email: string; completed_repairs: number; revenue: string }>;
  };
  charts: {
    repairs_by_status: Record<string, number>;
    repairs_over_time: TimePoint[];
    repairs_by_source?: Record<string, number>;
    repairs_by_priority?: Record<string, number>;
    repairs_by_category?: Record<string, number>;
    top_brands?: Array<{ name: string; total: number; period: number; revenue: string; top_models: Array<{ name: string; count: number }> }>;
    top_models?: Array<{ model: string; brand: string; total: number; period: number }>;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "Nowe", accepted: "Przyjęte", in_diagnostics: "W diagnostyce",
  diagnostics_done: "Diagnoza", quote_pending: "Wycena oczekuje",
  quote_sent: "Wycena wysłana", quote_accepted: "Wycena zaakceptowana",
  quote_rejected: "Wycena odrzucona", waiting_for_parts: "Czeka na części",
  in_repair: "W naprawie", repair_done: "Naprawa ukończona",
  in_testing: "W testowaniu", testing_passed: "Testy OK", testing_failed: "Testy nieudane",
  ready_for_pickup: "Do odbioru", picked_up: "Odebrane", shipped: "Wysłane",
  delivered: "Dostarczone", cancelled: "Anulowane", unrepairable: "Nieopłacalna", abandoned: "Porzucone",
};

const SOURCE_LABELS: Record<string, string> = {
  online: "Formularz online", in_person: "Stacjonarnie", phone: "Telefon",
  email: "E-mail", facebook: "Facebook", whatsapp: "WhatsApp", other: "Inne",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niski", normal: "Normalny", high: "Wysoki", urgent: "Pilny", same_day: "Same Day",
};

const CATEGORY_LABELS: Record<string, string> = {
  phone: "Telefon", tablet: "Tablet", smartwatch: "Smartwatch", laptop: "Laptop",
  desktop: "Komputer", printer: "Drukarka", console: "Konsola",
  data_recovery: "Odzysk danych", other: "Inne",
};

const PALETTE = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#4b5563", normal: "#3b82f6", high: "#f59e0b", urgent: "#ef4444", same_day: "#ec4899",
};

const SOURCE_COLORS: Record<string, string> = {
  online: "#6366f1", in_person: "#22c55e", phone: "#f59e0b",
  email: "#3b82f6", facebook: "#4f46e5", whatsapp: "#10b981", other: "#4b5563",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone size={13} />, tablet: <Tablet size={13} />, smartwatch: <Watch size={13} />,
  laptop: <Laptop size={13} />, desktop: <Monitor size={13} />, printer: <Printer size={13} />,
  console: <Gamepad2 size={13} />, data_recovery: <HardDrive size={13} />, other: <Zap size={13} />,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPln(v: string | number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("pl-PL") + " zł";
}

function fmtDate(iso: string) {
  return iso.slice(5, 10).replace("-", ".");
}

/** Catmull-Rom → Cubic Bezier smooth path */
function smoothLinePath(pts: [number, number][], tension = 0.18): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev2 = pts[Math.max(0, i - 2)];
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const cp1x = prev[0] + (curr[0] - prev2[0]) * tension;
    const cp1y = prev[1] + (curr[1] - prev2[1]) * tension;
    const cp2x = curr[0] - (next[0] - prev[0]) * tension;
    const cp2y = curr[1] - (next[1] - prev[1]) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`;
  }
  return d;
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, value, {
      duration: 1.2, ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { if (ref.current) ref.current.textContent = format ? format(v) : Math.round(v).toLocaleString("pl-PL"); },
    });
    return () => ctrl.stop();
  }, [inView, value, format]);
  return <span ref={ref}>0</span>;
}

// ─── PremiumAreaChart ─────────────────────────────────────────────────────────

function PremiumAreaChart({ points }: { points: TimePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mode, setMode] = useState<"count" | "revenue">("count");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver((e) => setWidth(e[0].contentRect.width || 700));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, [points]);

  const pts = points.slice(-60);
  const H = 260;
  const pad = { t: 20, r: 20, b: 40, l: 52 };
  const iw = width - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  if (!pts.length) return <p className="py-12 text-center text-sm text-[#4b5563]">Brak danych w wybranym okresie.</p>;

  const vals = pts.map((p) => mode === "count" ? p.count : Number(p.revenue));
  const maxVal = Math.max(1, ...vals);
  const minVal = 0;

  const cx = (i: number) => pad.l + (i / (pts.length - 1 || 1)) * iw;
  const cy = (v: number) => pad.t + ih - ((v - minVal) / (maxVal - minVal)) * ih;

  const coords: [number, number][] = pts.map((p, i) => [cx(i), cy(mode === "count" ? p.count : Number(p.revenue))]);
  const linePath = smoothLinePath(coords);
  const areaPath = linePath
    ? `${linePath} L ${cx(pts.length - 1)} ${pad.t + ih} L ${cx(0)} ${pad.t + ih} Z`
    : "";

  const yTicks = 5;
  const xStep = Math.max(1, Math.floor(pts.length / 8));

  const isRevMode = mode === "revenue";
  const lineColor = isRevMode ? "#22c55e" : "#6366f1";
  const line2Color = isRevMode ? "#06b6d4" : "#3b82f6";
  const gradId = `ag-${mode}`;

  // tooltip positioning
  const tooltipPt = hovered !== null ? pts[hovered] : null;
  const ttX = hovered !== null ? cx(hovered) : 0;
  const ttY = hovered !== null ? cy(vals[hovered]) : 0;
  const ttLeft = ttX > width * 0.65;

  return (
    <div ref={containerRef} className="w-full select-none">
      {/* Mode toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5">
          {(["count", "revenue"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                mode === m ? "bg-white/[0.1] text-white" : "text-[#6b7280] hover:text-white"
              }`}
            >
              {m === "count" ? "Liczba napraw" : "Przychód (zł)"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full" style={{ background: `linear-gradient(90deg, ${lineColor}, ${line2Color})` }} />
            <span className="text-[10px] text-[#6b7280]">{isRevMode ? "Przychód" : "Naprawy"}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          style={{ overflow: "visible" }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
              <stop offset="60%" stopColor={lineColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={`lg-${mode}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={lineColor} />
              <stop offset="100%" stopColor={line2Color} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="cclip">
              <rect x={pad.l} y={pad.t - 8} width={iw} height={ih + 10} />
            </clipPath>
          </defs>

          {/* Horizontal grid + Y labels */}
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const y = pad.t + (i / yTicks) * ih;
            const rawVal = maxVal * (1 - i / yTicks);
            const label = isRevMode
              ? rawVal >= 1000 ? `${Math.round(rawVal / 1000)}k` : Math.round(rawVal).toString()
              : Math.round(rawVal).toString();
            return (
              <g key={i}>
                <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y}
                  stroke={i === yTicks ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}
                  strokeWidth={i === yTicks ? 1 : 1} />
                <text x={pad.l - 8} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10" fontFamily="monospace">{label}</text>
              </g>
            );
          })}

          {/* X axis labels */}
          {pts.filter((_, i) => i % xStep === 0 || i === pts.length - 1).map((p) => {
            const origIdx = pts.indexOf(p);
            return (
              <text key={p.period} x={cx(origIdx)} y={H - 8} textAnchor="middle" fill="#4b5563" fontSize="10">
                {fmtDate(p.period)}
              </text>
            );
          })}

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={`url(#${gradId})`}
            clipPath="url(#cclip)"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Smooth line (glow) */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeOpacity="0.25"
            strokeLinecap="round"
            filter="url(#glow)"
            clipPath="url(#cclip)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: ready ? 1 : 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Smooth line (solid) */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={`url(#lg-${mode})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#cclip)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: ready ? 1 : 0 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Interactive hover areas */}
          {pts.map((_, i) => {
            const barW = iw / pts.length;
            return (
              <rect
                key={i}
                x={cx(i) - barW / 2}
                y={pad.t}
                width={barW}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
            );
          })}

          {/* Hover crosshair + dot */}
          {hovered !== null && coords[hovered] && (
            <g>
              <line
                x1={coords[hovered][0]} y1={pad.t}
                x2={coords[hovered][0]} y2={pad.t + ih}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {/* Outer ring */}
              <motion.circle
                cx={coords[hovered][0]} cy={coords[hovered][1]} r={8}
                fill={lineColor} fillOpacity="0.15"
                initial={{ r: 4 }} animate={{ r: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <circle cx={coords[hovered][0]} cy={coords[hovered][1]} r={4.5}
                fill={lineColor} stroke="#0a0b10" strokeWidth="2" />
              <circle cx={coords[hovered][0]} cy={coords[hovered][1]} r={2}
                fill="white" />
            </g>
          )}
        </svg>

        {/* Floating tooltip */}
        <AnimatePresence>
          {hovered !== null && tooltipPt && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-10"
              style={{
                left: ttLeft ? "auto" : ttX + 12,
                right: ttLeft ? width - ttX + 12 : "auto",
                top: Math.max(0, ttY - 60),
              }}
            >
              <div className="rounded-xl border border-white/10 bg-[#12131a] px-3.5 py-2.5 shadow-2xl shadow-black/60 backdrop-blur-md">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">{tooltipPt.period}</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                    <span className="text-xs text-[#9ca3af]">Naprawy</span>
                    <span className="ml-auto text-xs font-bold text-white">{tooltipPt.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    <span className="text-xs text-[#9ca3af]">Przychód</span>
                    <span className="ml-auto text-xs font-bold text-[#22c55e]">{fmtPln(tooltipPt.revenue)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── PremiumDonut ─────────────────────────────────────────────────────────────

function PremiumDonut({ data, label }: {
  data: Array<{ key: string; label: string; value: number; color: string }>;
  label: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  useEffect(() => { const t = setTimeout(() => setReady(true), 150); return () => clearTimeout(t); }, [data]);

  const R = 70; const STROKE = 20; const CX = 100; const CY = 100;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const len = pct * circ;
    const seg = { ...d, offset: circ - offset, len, pct };
    offset += len;
    return seg;
  });

  const hoveredSeg = segments.find((s) => s.key === hovered);
  const displayValue = hoveredSeg ? hoveredSeg.value : total;
  const displayLabel = hoveredSeg ? hoveredSeg.label : label;
  const displayPct = hoveredSeg ? `${((hoveredSeg.value / total) * 100).toFixed(1)}%` : "";

  return (
    <div className="flex flex-col gap-4">
      {/* SVG donut */}
      <div className="flex justify-center">
        <svg width={200} height={200} viewBox="0 0 200 200" className="overflow-visible">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />

          {/* Segments */}
          {segments.map((seg, i) => {
            const isHov = hovered === seg.key;
            const R2 = isHov ? R + 4 : R;
            const circ2 = 2 * Math.PI * R2;
            const scale = circ2 / circ;
            return (
              <motion.circle
                key={seg.key}
                cx={CX} cy={CY} r={R2}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHov ? STROKE + 4 : STROKE}
                strokeDasharray={`${seg.len * scale} ${circ2 - seg.len * scale}`}
                strokeDashoffset={seg.offset * scale}
                strokeLinecap="butt"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ cursor: "pointer", filter: isHov ? `drop-shadow(0 0 8px ${seg.color}99)` : "none" }}
                initial={{ strokeDasharray: `0 ${circ}` }}
                animate={ready ? {
                  strokeDasharray: `${seg.len * scale} ${circ2 - seg.len * scale}`,
                  r: R2,
                  strokeWidth: isHov ? STROKE + 4 : STROKE,
                } : {}}
                transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
                onMouseEnter={() => setHovered(seg.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Center value */}
          <motion.text
            x={CX} y={CY - 8} textAnchor="middle" fill="white" fontSize="26" fontWeight="800"
            animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.6 }}
          >
            {displayValue.toLocaleString("pl-PL")}
          </motion.text>
          <motion.text
            x={CX} y={CY + 10} textAnchor="middle" fill="#6b7280" fontSize="10"
            animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ delay: 0.7 }}
          >
            {displayLabel}
          </motion.text>
          {displayPct && (
            <text x={CX} y={CY + 24} textAnchor="middle" fill="#9ca3af" fontSize="12" fontWeight="600">
              {displayPct}
            </text>
          )}
        </svg>
      </div>

      {/* Legend — animated bars */}
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="group cursor-default"
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <motion.div
                  className="h-2 w-2 shrink-0 rounded-full"
                  animate={{ scale: hovered === seg.key ? 1.5 : 1 }}
                  style={{ background: seg.color }}
                />
                <span className={`truncate text-[11px] transition-colors ${hovered === seg.key ? "text-white" : "text-[#9ca3af]"}`}>
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#4b5563]">
                  {((seg.value / total) * 100).toFixed(0)}%
                </span>
                <span className={`text-xs font-bold transition-colors ${hovered === seg.key ? "text-white" : "text-[#d1d5db]"}`}>
                  {seg.value}
                </span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: seg.color, opacity: hovered === seg.key ? 1 : 0.6 }}
                initial={{ width: 0 }}
                whileInView={{ width: `${seg.pct * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── RevenueBarChart ──────────────────────────────────────────────────────────

function RevenueBarChart({ points }: { points: TimePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);
  const [hovered, setHovered] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver((e) => setWidth(e[0].contentRect.width || 700));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, [points]);

  const pts = points.filter((p) => Number(p.revenue) > 0).slice(-30);
  const H = 200;
  const pad = { t: 16, r: 16, b: 36, l: 52 };
  const iw = width - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  if (!pts.length) return <p className="py-8 text-center text-sm text-[#4b5563]">Brak przychodów w wybranym okresie.</p>;

  const maxRev = Math.max(1, ...pts.map((p) => Number(p.revenue)));
  const barW = Math.max(4, iw / pts.length - 3);
  const xStep = Math.max(1, Math.floor(pts.length / 7));

  const yTicks = 4;

  return (
    <div ref={containerRef} className="w-full" onMouseLeave={() => setHovered(null)}>
      <svg width="100%" height={H} viewBox={`0 0 ${width} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="revbar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="revbar-hov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = pad.t + (i / yTicks) * ih;
          const v = maxRev * (1 - i / yTicks);
          const label = v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v).toString();
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={pad.l + iw} y2={y}
                stroke={i === yTicks ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"} strokeWidth="1" />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fill="#4b5563" fontSize="10" fontFamily="monospace">{label}</text>
            </g>
          );
        })}

        {/* Bars */}
        {pts.map((p, i) => {
          const bh = Math.max(2, (Number(p.revenue) / maxRev) * ih);
          const x = pad.l + (i / (pts.length - 1 || 1)) * iw - barW / 2;
          const y = pad.t + ih - bh;
          const isHov = hovered === i;
          return (
            <g key={p.period} onMouseEnter={() => setHovered(i)}>
              {/* Bar */}
              <motion.rect
                x={x} y={isHov ? y - 2 : y}
                width={barW}
                height={isHov ? bh + 2 : bh}
                rx={Math.min(4, barW / 3)}
                fill={isHov ? "url(#revbar-hov)" : "url(#revbar)"}
                opacity={hovered !== null && !isHov ? 0.35 : 1}
                initial={{ height: 0, y: pad.t + ih }}
                animate={ready ? { height: isHov ? bh + 2 : bh, y: isHov ? y - 2 : y } : {}}
                transition={{ duration: 0.6, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* X label */}
              {i % xStep === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="#4b5563" fontSize="9">
                  {fmtDate(p.period)}
                </text>
              )}
              {/* Hover value label */}
              {isHov && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="700">
                  {Math.round(Number(p.revenue) / 1000) >= 1
                    ? `${(Number(p.revenue) / 1000).toFixed(1)}k`
                    : Math.round(Number(p.revenue)).toString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── BrandsModelsSection ─────────────────────────────────────────────────────

type BrandEntry = { name: string; total: number; period: number; revenue: string; top_models: Array<{ name: string; count: number }> };
type ModelEntry = { model: string; brand: string; total: number; period: number };

const BRAND_PALETTE = [
  "#6366f1","#3b82f6","#22c55e","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#ec4899","#84cc16","#f97316",
  "#14b8a6","#a855f7","#f43f5e","#eab308","#0ea5e9",
];

function BrandsModelsSection({
  brands, models, days,
}: { brands: BrandEntry[]; models: ModelEntry[]; days: number }) {
  const [tab, setTab] = useState<"brands" | "models">("brands");
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const maxTotal = Math.max(1, ...brands.map((b) => b.total));
  const maxModelTotal = Math.max(1, ...models.map((m) => m.total));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/[0.07] bg-[#0c0d12] p-5"
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Marki & Modele urządzeń</h2>
          <p className="mt-0.5 text-[11px] text-[#4b5563]">
            Dane z całego systemu · w nawiasach liczba napraw w ostatnich {days} dniach
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-0.5">
          {(["brands", "models"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                tab === t ? "bg-white/[0.1] text-white" : "text-[#6b7280] hover:text-white"
              }`}
            >
              {t === "brands" ? `Marki (${brands.length})` : `Modele (${models.length})`}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "brands" ? (
          <motion.div
            key="brands"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {brands.length === 0 && (
              <p className="py-8 text-center text-sm text-[#4b5563]">Brak danych o markach.</p>
            )}
            {brands.map((brand, i) => {
              const color = BRAND_PALETTE[i % BRAND_PALETTE.length];
              const pct = Math.round((brand.total / maxTotal) * 100);
              const isOpen = expandedBrand === brand.name;
              return (
                <div key={brand.name}>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setExpandedBrand(isOpen ? null : brand.name)}
                    className="w-full rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03] text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank + color dot */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-5 text-center text-[11px] font-bold text-[#374151]">{i + 1}</span>
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0"
                          style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
                        >
                          {brand.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-white truncate">{brand.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {brand.period > 0 && (
                              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: `${color}20`, color }}>
                                +{brand.period} teraz
                              </span>
                            )}
                            <span className="text-xs font-bold text-white">{brand.total}</span>
                            <span className="text-[10px] text-[#4b5563]">napraw</span>
                            {Number(brand.revenue) > 0 && (
                              <span className="text-[11px] font-semibold text-[#22c55e]">{fmtPln(brand.revenue)}</span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>

                      {/* Expand icon */}
                      {brand.top_models.length > 0 && (
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0 text-[#4b5563] group-hover:text-[#9ca3af]"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* Expanded models */}
                  <AnimatePresence>
                    {isOpen && brand.top_models.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mb-1 ml-12 mr-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#374151]">
                            Top modele · {brand.name}
                          </p>
                          <div className="space-y-2">
                            {brand.top_models.map((m, mi) => {
                              const maxM = brand.top_models[0]?.count || 1;
                              return (
                                <div key={m.name} className="flex items-center gap-2">
                                  <span className="w-4 shrink-0 text-center text-[10px] text-[#374151]">{mi + 1}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="truncate text-xs text-[#d1d5db]">{m.name}</span>
                                      <span className="shrink-0 text-xs font-semibold text-white">{m.count}</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                                      <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: color, opacity: 0.7 }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(m.count / maxM) * 100}%` }}
                                        transition={{ duration: 0.5, delay: mi * 0.05 }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="models"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {models.length === 0 && (
              <p className="py-8 text-center text-sm text-[#4b5563]">Brak danych o modelach.</p>
            )}
            <div className="divide-y divide-white/[0.04]">
              {models.map((m, i) => {
                const color = BRAND_PALETTE[i % BRAND_PALETTE.length];
                const pct = Math.round((m.total / maxModelTotal) * 100);
                return (
                  <motion.div
                    key={`${m.brand}-${m.model}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="w-6 shrink-0 text-center text-[11px] font-bold text-[#374151]">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm font-medium text-white">{m.model}</span>
                          {m.brand && (
                            <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#6b7280]">
                              {m.brand}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {m.period > 0 && (
                            <span className="text-[10px] font-semibold text-[#6366f1]">+{m.period}</span>
                          )}
                          <span className="text-sm font-bold text-white">{m.total}</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.05 + i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── HorizontalBar ────────────────────────────────────────────────────────────

function HBar({ label, value, max, color, sub, icon, rank }: {
  label: string; value: number; max: number; color: string;
  sub?: string; icon?: React.ReactNode; rank?: number;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group cursor-default">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {rank !== undefined && (
            <span className="w-4 shrink-0 text-center text-[10px] font-bold text-[#4b5563]">{rank}</span>
          )}
          {icon && <span className="shrink-0 text-[#6b7280]">{icon}</span>}
          <span className="truncate text-xs font-medium text-[#d1d5db] group-hover:text-white transition-colors">{label}</span>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xs font-bold text-white">{value.toLocaleString("pl-PL")}</span>
          {sub && <span className="ml-1.5 text-[10px] text-[#4b5563]">{sub}</span>}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color, trend, size = "md" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: "up" | "down" | "neutral"; size?: "lg" | "md";
}) {
  const isNum = typeof value === "number";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0d12] ${size === "lg" ? "p-5" : "p-4"}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-15 blur-3xl" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1a`, color }}>
          {icon}
        </div>
        {trend && trend !== "neutral" && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </div>
        )}
      </div>
      <div className={size === "lg" ? "mt-4" : "mt-3"}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4b5563]">{label}</p>
        <p className={`mt-1 font-bold text-white ${size === "lg" ? "text-3xl" : "text-2xl"}`}>
          {isNum ? <AnimatedNumber value={value as number} /> : value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-[#6b7280]">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, badge, children, className = "" }: {
  title: string; subtitle?: string; badge?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`rounded-2xl border border-white/[0.07] bg-[#0c0d12] p-5 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-[#4b5563]">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

// ─── RepairRow ────────────────────────────────────────────────────────────────

function RepairRow({ r, repairHrefBase }: { r: RepairRequestListItem; repairHrefBase: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.04] py-2.5 last:border-0">
      <div className="min-w-0">
        <Link href={`${repairHrefBase}/${r.id}`} className="text-sm font-semibold text-white hover:text-[#6366f1] transition-colors">
          {r.repair_number}
        </Link>
        <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">{r.device_name} · {r.client_name}</p>
      </div>
      <span className="shrink-0 text-[11px] text-[#6b7280]">{r.status_display}</span>
    </div>
  );
}

// ─── StaffRanking ─────────────────────────────────────────────────────────────

function StaffRanking({ staff }: { staff: AdminDashboardResponse["tables"]["top_staff"] }) {
  if (!staff.length) return <p className="text-sm text-[#4b5563]">Brak danych.</p>;
  const maxRev = Math.max(1, ...staff.map((s) => Number(s.revenue)));
  const maxRep = Math.max(1, ...staff.map((s) => s.completed_repairs));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      {staff.map((s, i) => (
        <motion.div
          key={s.user_id}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5"
        >
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{medals[i] ?? `#${i + 1}`}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                <p className="text-[10px] text-[#4b5563] truncate">{s.email}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-white">{s.completed_repairs}</p>
              <p className="text-[11px] text-[#22c55e] font-semibold">{fmtPln(s.revenue)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-[10px] text-[#4b5563]">Naprawy</span>
                <span className="text-[10px] text-[#4b5563]">{Math.round((s.completed_repairs / maxRep) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(s.completed_repairs / maxRep) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <span className="text-[10px] text-[#4b5563]">Przychód</span>
                <span className="text-[10px] text-[#4b5563]">{Math.round((Number(s.revenue) / maxRev) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#06b6d4]"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(Number(s.revenue) / maxRev) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="col-span-3 h-80 rounded-2xl animate-pulse bg-white/[0.04]" />
        <div className="col-span-2 h-80 rounded-2xl animate-pulse bg-white/[0.04]" />
      </div>
      <div className="h-56 rounded-2xl animate-pulse bg-white/[0.04]" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-60 rounded-2xl animate-pulse bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isWorkerStatsRoute = pathname?.startsWith("/panel/statystyki") || pathname?.startsWith("/panel/stats");
  const canView = isAdmin || (isWorkerStatsRoute && isStaff);
  const repairHrefBase = isWorkerStatsRoute ? "/panel/naprawy" : "/admin-panel/repairs";
  const claimsHref = isWorkerStatsRoute ? "/panel/reklamacje" : "/admin-panel/claims";
  const panelLabel = isWorkerStatsRoute ? "Panel Pracownika" : "Panel Admina";

  const daysParam = Number(searchParams.get("days"));
  const days = DAY_OPTIONS.includes(daysParam as (typeof DAY_OPTIONS)[number]) ? daysParam : 30;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token || !canView) return;
    setLoading(true); setError(null);
    try {
      const res = await api.get<AdminDashboardResponse>(`/analytics/admin-dashboard/?days=${days}`, token);
      setData(res);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać statystyk."));
    } finally {
      setLoading(false);
    }
  }, [token, canView, days]);

  useEffect(() => { void load(); }, [load]);

  const setDays = (d: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("days", String(d));
    router.replace(`${pathname}?${next.toString()}`);
  };

  const kpi = data?.kpi;
  const charts = data?.charts;
  const tables = data?.tables;

  // All useMemo hooks before any conditional returns
  const statusChartData = useMemo(() => {
    if (!charts?.repairs_by_status) return [];
    return Object.entries(charts.repairs_by_status)
      .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([key, value], i) => ({ key, label: STATUS_LABELS[key] ?? key, value, color: PALETTE[i % PALETTE.length] }));
  }, [charts]);

  const sourceData = useMemo(() => {
    if (!charts?.repairs_by_source) return [];
    return Object.entries(charts.repairs_by_source)
      .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, label: SOURCE_LABELS[key] ?? key, value, color: SOURCE_COLORS[key] ?? "#6b7280" }));
  }, [charts]);

  const priorityData = useMemo(() => {
    if (!charts?.repairs_by_priority) return [];
    return Object.entries(charts.repairs_by_priority)
      .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, label: PRIORITY_LABELS[key] ?? key, value, color: PRIORITY_COLORS[key] ?? "#6b7280" }));
  }, [charts]);

  const categoryData = useMemo(() => {
    if (!charts?.repairs_by_category) return [];
    return Object.entries(charts.repairs_by_category)
      .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([key, value], i) => ({ key, label: CATEGORY_LABELS[key] ?? key, value, color: PALETTE[i % PALETTE.length] }));
  }, [charts]);

  const maxSource = useMemo(() => Math.max(1, ...sourceData.map((d) => d.value)), [sourceData]);
  const maxPriority = useMemo(() => Math.max(1, ...priorityData.map((d) => d.value)), [priorityData]);
  const maxCategory = useMemo(() => Math.max(1, ...categoryData.map((d) => d.value)), [categoryData]);

  if (!canView) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-[#fca5a5]">Brak dostępu do statystyk.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6366f1]">{panelLabel}</p>
          <h1 className="mt-1.5 text-2xl font-bold text-white">Statystyki & Analityka</h1>
          <p className="mt-1 text-xs text-[#4b5563]">
            Kompleksowy przegląd KPI, trendów i wydajności serwisu
            {lastUpdated && <> · <span className="text-[#6b7280]">Odśw. {lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {DAY_OPTIONS.map((d) => (
              <button key={d} type="button" onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  days === d ? "bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25" : "text-[#6b7280] hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void load()} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[#6b7280] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Odśwież
          </button>
        </div>
      </motion.header>

      {error && <ErrorState error={error} onRetry={() => void load()} />}

      {loading && !data ? <LoadingSkeleton /> : kpi && charts && tables ? (
        <>
          {/* ── Hero KPI ── */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#374151]">Kluczowe wskaźniki · {days} dni</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard size="lg" label="Przychód (zakończone)" value={fmtPln(kpi.revenue_total)}
                sub={`Wartość wycen: ${fmtPln(kpi.quote_value_total)}`}
                icon={<DollarSign size={18} />} color="#22c55e" trend="up" />
              <KpiCard size="lg" label="Zakończone naprawy" value={kpi.completed_count}
                sub={`${days}-dniowy okres`}
                icon={<CheckCircle size={18} />} color="#3b82f6" trend="up" />
              <KpiCard size="lg" label="W toku" value={kpi.in_progress_count}
                sub="Aktywnie prowadzone"
                icon={<Activity size={18} />} color="#6366f1" trend="neutral" />
              <KpiCard size="lg" label="Zaległe (po terminie)" value={kpi.overdue_count}
                sub={kpi.overdue_count > 0 ? "Wymagają uwagi!" : "Wszystko na czas"}
                icon={<AlertTriangle size={18} />}
                color={kpi.overdue_count > 0 ? "#ef4444" : "#22c55e"}
                trend={kpi.overdue_count > 0 ? "down" : "up"} />
            </div>
          </section>

          {/* ── Secondary KPI ── */}
          <section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Nowe zgłoszenia" value={kpi.new_count} sub="Czekają na przyjęcie"
                icon={<Zap size={16} />} color="#f59e0b" />
              <KpiCard label="Gotowe do odbioru" value={kpi.ready_for_pickup_count}
                sub={`Nieodebrane >7 dni: ${kpi.unclaimed_count}`}
                icon={<Package size={16} />} color="#06b6d4" />
              <KpiCard label="Reklamacje / Gwarancje" value={`${kpi.complaints_count} / ${kpi.warranties_count}`}
                sub="Aktywne w serwisie" icon={<XCircle size={16} />} color="#ec4899" />
              <KpiCard label="Śr. czas realizacji"
                value={kpi.avg_completion_days != null ? `${kpi.avg_completion_days} dni` : "—"}
                sub="Od przyjęcia do zakończenia" icon={<Clock size={16} />} color="#8b5cf6" />
            </div>
          </section>

          {/* ── Main chart: Area + Donut ── */}
          <section className="grid gap-4 lg:grid-cols-5">
            <SectionCard className="lg:col-span-3" title="Naprawy w czasie"
              subtitle={`Trend dzienny — ostatnie ${days} dni`}
              badge={
                <span className="rounded-full bg-[#6366f1]/10 px-2.5 py-1 text-[10px] font-semibold text-[#818cf8]">
                  {charts.repairs_over_time.length} dni danych
                </span>
              }
            >
              <PremiumAreaChart points={charts.repairs_over_time} />
            </SectionCard>

            <SectionCard className="lg:col-span-2" title="Rozkład statusów"
              subtitle="Naprawy wg aktualnego statusu">
              <PremiumDonut data={statusChartData} label="łącznie" />
            </SectionCard>
          </section>

          {/* ── Revenue bars ── */}
          <SectionCard
            title="Przychód dzienny"
            subtitle="Suma przychodów z zakończonych napraw w każdym dniu okresu"
            badge={<DollarSign size={14} className="text-[#22c55e]" />}
          >
            <RevenueBarChart points={charts.repairs_over_time} />
          </SectionCard>

          {/* ── Brands / Sources / Categories ── */}
          <section className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Źródła zgłoszeń" subtitle="Kanały, którymi trafiają klienci"
              badge={<Target size={13} className="text-[#4b5563]" />}>
              {sourceData.length > 0 ? (
                <div className="space-y-3">
                  {sourceData.map((s, i) => (
                    <HBar key={s.key} label={s.label} value={s.value} max={maxSource}
                      color={s.color} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#4b5563]">Brak danych.</p>
              )}
            </SectionCard>

            <SectionCard title="Kategorie urządzeń" subtitle="Rozkład wg typu sprzętu">
              {categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map((c, i) => (
                    <HBar key={c.key} label={c.label} value={c.value} max={maxCategory}
                      color={c.color} icon={CATEGORY_ICONS[c.key]} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#4b5563]">Brak danych.</p>
              )}
            </SectionCard>

            <SectionCard className="lg:col-span-1" title="Priorytety" subtitle="Rozkład pilności zgłoszeń">
              {priorityData.length > 0 ? (
                <div className="space-y-3">
                  {priorityData.map((p, i) => (
                    <HBar key={p.key} label={p.label} value={p.value} max={maxPriority}
                      color={p.color} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[#4b5563]">Brak danych.</p>
              )}
            </SectionCard>
          </section>

          {/* ── Marki & Modele (całość systemu) ── */}
          <BrandsModelsSection
            brands={charts.top_brands ?? []}
            models={charts.top_models ?? []}
            days={days}
          />

          {/* ── Staff Ranking ── */}
          <SectionCard title="Ranking pracowników"
            subtitle={`Zakończone naprawy i przychód w ciągu ${days} dni`}
            badge={<Award size={14} className="text-[#f59e0b]" />}
          >
            <StaffRanking staff={tables.top_staff} />
          </SectionCard>

          {/* ── Operational Tables ── */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#374151]">Tabele operacyjne</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Najbardziej zaległe"
                subtitle="Naprawy po terminie — najstarsze pierwsze"
                badge={<AlertTriangle size={13} className="text-[#ef4444]" />}>
                {tables.most_overdue.length > 0
                  ? tables.most_overdue.map((r) => <RepairRow key={r.id} r={r} repairHrefBase={repairHrefBase} />)
                  : <p className="py-6 text-center text-sm text-[#22c55e]">Brak zaległości!</p>}
              </SectionCard>

              <SectionCard title="Długo nieodebrane"
                subtitle="Gotowe do odbioru ponad 7 dni"
                badge={<Clock size={13} className="text-[#f59e0b]" />}>
                {tables.unclaimed_repairs.length > 0
                  ? tables.unclaimed_repairs.map((r) => <RepairRow key={r.id} r={r} repairHrefBase={repairHrefBase} />)
                  : <p className="py-6 text-center text-sm text-[#22c55e]">Brak nieodebranych!</p>}
              </SectionCard>

              <SectionCard title="Aktywne reklamacje" subtitle="Otwarte sprawy reklamacyjne"
                badge={
                  <Link href={claimsHref} className="text-[11px] font-semibold text-[#6366f1] hover:underline">
                    Wszystkie →
                  </Link>
                }>
                {tables.active_complaints.length > 0
                  ? tables.active_complaints.map((r) => <RepairRow key={r.id} r={r} repairHrefBase={repairHrefBase} />)
                  : <p className="py-6 text-center text-sm text-[#4b5563]">Brak reklamacji.</p>}
              </SectionCard>

              <SectionCard title="Aktywne gwarancje" subtitle="Otwarte sprawy gwarancyjne">
                {tables.active_warranties.length > 0
                  ? tables.active_warranties.map((r) => <RepairRow key={r.id} r={r} repairHrefBase={repairHrefBase} />)
                  : <p className="py-6 text-center text-sm text-[#4b5563]">Brak gwarancji.</p>}
              </SectionCard>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
