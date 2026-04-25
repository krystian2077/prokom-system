"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, useInView, animate, useMotionValue, useTransform } from "framer-motion";
import {
  TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock,
  Award, Wrench, CheckCircle, XCircle, Package, BarChart3,
  Smartphone, Laptop, Tablet, Watch, Monitor, Printer, Gamepad2,
  HardDrive, Zap, Users, DollarSign, Activity, Target,
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
    top_staff: Array<{
      user_id: string;
      full_name: string;
      email: string;
      completed_repairs: number;
      revenue: string;
    }>;
  };
  charts: {
    repairs_by_status: Record<string, number>;
    repairs_over_time: TimePoint[];
    repairs_by_source?: Record<string, number>;
    repairs_by_priority?: Record<string, number>;
    repairs_by_category?: Record<string, number>;
    top_brands?: Array<{ name: string; count: number; revenue: string }>;
    top_models?: Array<{ model: string; brand: string; count: number }>;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "Nowe", accepted: "Przyjęte", in_diagnostics: "W diagnostyce",
  diagnostics_done: "Diagnoza ukończona", quote_pending: "Wycena oczekuje",
  quote_sent: "Wycena wysłana", quote_accepted: "Wycena zaakceptowana",
  quote_rejected: "Wycena odrzucona", waiting_for_parts: "Czeka na części",
  in_repair: "W naprawie", repair_done: "Naprawa ukończona", in_testing: "W testowaniu",
  testing_passed: "Testy OK", testing_failed: "Testy nieudane", ready_for_pickup: "Gotowe do odbioru",
  picked_up: "Odebrane", shipped: "Wysłane", delivered: "Dostarczone",
  cancelled: "Anulowane", unrepairable: "Nieopłacalna", abandoned: "Porzucone",
};

const SOURCE_LABELS: Record<string, string> = {
  online: "Formularz online", in_person: "Przyjęcie stacjonarne", phone: "Telefoniczne",
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

const STATUS_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6b7280", normal: "#3b82f6", high: "#f59e0b", urgent: "#ef4444", same_day: "#ec4899",
};

const SOURCE_COLORS: Record<string, string> = {
  online: "#3b82f6", in_person: "#22c55e", phone: "#f59e0b",
  email: "#6366f1", facebook: "#4f46e5", whatsapp: "#22c55e", other: "#6b7280",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone size={14} />, tablet: <Tablet size={14} />, smartwatch: <Watch size={14} />,
  laptop: <Laptop size={14} />, desktop: <Monitor size={14} />, printer: <Printer size={14} />,
  console: <Gamepad2 size={14} />, data_recovery: <HardDrive size={14} />, other: <Zap size={14} />,
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

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = format ? format(latest) : Math.round(latest).toLocaleString("pl-PL");
        }
      },
    });
    return () => controls.stop();
  }, [isInView, value, format]);

  return <span ref={ref}>0</span>;
}

// ─── Area Line Chart ─────────────────────────────────────────────────────────

function AreaLineChart({ points }: { points: TimePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width || 500);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, [points]);

  const h = 180;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const iw = width - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;

  const pts = points.slice(-30);
  if (!pts.length) return <p className="text-sm text-[#6b7280] py-8 text-center">Brak danych w wybranym okresie.</p>;

  const maxCount = Math.max(1, ...pts.map((p) => p.count));
  const maxRevenue = Math.max(1, ...pts.map((p) => Number(p.revenue)));

  const cx = (i: number) => pad.left + (i / (pts.length - 1 || 1)) * iw;
  const cy = (v: number, max: number) => pad.top + ih - (v / max) * ih;

  const countPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${cy(p.count, maxCount)}`).join(" ");
  const revPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${cx(i)} ${cy(Number(p.revenue), maxRevenue)}`).join(" ");

  const areaPath = `${countPath} L ${cx(pts.length - 1)} ${pad.top + ih} L ${cx(0)} ${pad.top + ih} Z`;

  const yTicks = 4;
  const xStep = Math.max(1, Math.floor(pts.length / 7));

  return (
    <div ref={containerRef} className="w-full">
      <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x={pad.left} y={pad.top - 4} width={iw} height={ih + 4} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = pad.top + (i / yTicks) * ih;
          const val = Math.round(maxCount * (1 - i / yTicks));
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + iw} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="10">{val}</text>
            </g>
          );
        })}

        {/* X axis labels */}
        {pts.filter((_, i) => i % xStep === 0).map((p, i) => {
          const origIdx = i * xStep;
          return (
            <text key={p.period} x={cx(origIdx)} y={h - 4} textAnchor="middle" fill="#6b7280" fontSize="10">
              {fmtDate(p.period)}
            </text>
          );
        })}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#areaGrad)"
          clipPath="url(#chartClip)"
          initial={{ opacity: 0 }}
          animate={{ opacity: animated ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Revenue line */}
        <motion.path
          d={revPath}
          fill="none"
          stroke="url(#revGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          clipPath="url(#chartClip)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: animated ? 1 : 0, opacity: animated ? 0.7 : 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        {/* Count line */}
        <motion.path
          d={countPath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#chartClip)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animated ? 1 : 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Hover dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <rect
              x={cx(i) - 8}
              y={pad.top}
              width={16}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "crosshair" }}
            />
            {hoveredIdx === i && (
              <>
                <line x1={cx(i)} y1={pad.top} x2={cx(i)} y2={pad.top + ih} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 2" />
                <circle cx={cx(i)} cy={cy(p.count, maxCount)} r="4" fill="#6366f1" stroke="#07080d" strokeWidth="2" />
                <rect x={Math.min(cx(i) - 60, iw - 80)} y={cy(p.count, maxCount) - 44} width="110" height="40" rx="6" fill="#1a1b23" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x={Math.min(cx(i) - 4, iw - 34)} y={cy(p.count, maxCount) - 28} fill="#fff" fontSize="11" fontWeight="600">{p.count} napraw</text>
                <text x={Math.min(cx(i) - 4, iw - 34)} y={cy(p.count, maxCount) - 14} fill="#22c55e" fontSize="10">{fmtPln(p.revenue)}</text>
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]" />
          <span className="text-[10px] text-[#9ca3af]">Liczba napraw</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6 border-t-2 border-dashed border-[#22c55e]/70" />
          <span className="text-[10px] text-[#9ca3af]">Przychód</span>
        </div>
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data, label }: { data: Array<{ key: string; label: string; value: number; color: string }>; label: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 60;
  const stroke = 18;
  const circ = 2 * Math.PI * r;
  const cx = 90;
  const cy = 90;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, [data]);

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const len = pct * circ;
    const seg = { ...d, offset: circ - offset, len, pct };
    offset += len;
    return seg;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={seg.offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={animated ? { strokeDasharray: `${seg.len} ${circ - seg.len}` } : {}}
            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f9fafb" fontSize="22" fontWeight="700">{total.toLocaleString("pl-PL")}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize="10">{label}</text>
      </svg>
    </div>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────

function HBar({
  label, value, max, color, sub, icon,
}: {
  label: string; value: number; max: number; color: string; sub?: string; icon?: React.ReactNode;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0 text-[#9ca3af]">{icon}</span>}
          <span className="truncate text-xs font-medium text-[#d1d5db]">{label}</span>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xs font-semibold text-white">{value.toLocaleString("pl-PL")}</span>
          {sub && <span className="ml-1 text-[10px] text-[#6b7280]">{sub}</span>}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, color, trend, size = "md",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "neutral";
  size?: "lg" | "md";
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
      {/* Glow accent */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: color }} />

      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </div>
        {trend && trend !== "neutral" && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </div>
        )}
      </div>

      <div className={`${size === "lg" ? "mt-4" : "mt-3"}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
        <p className={`mt-1 font-bold text-white ${size === "lg" ? "text-3xl" : "text-2xl"}`}>
          {isNum ? <AnimatedNumber value={value as number} /> : value}
        </p>
        {sub && <p className="mt-1 text-[11px] text-[#6b7280]">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, badge, children, className = "",
}: {
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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-[#6b7280]">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Repair Row ───────────────────────────────────────────────────────────────

function RepairRow({ r, showDaysAgo }: { r: RepairRequestListItem; showDaysAgo?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.05] py-2.5 last:border-0">
      <div className="min-w-0">
        <Link
          href={`/admin-panel/repairs/${r.id}`}
          className="text-sm font-semibold text-white hover:text-[#6366f1] transition-colors"
        >
          {r.repair_number}
        </Link>
        <p className="mt-0.5 truncate text-[11px] text-[#9ca3af]">
          {r.device_name} · {r.client_name}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[11px] text-[#9ca3af]">{r.status_display}</span>
      </div>
    </div>
  );
}

// ─── Staff Ranking ────────────────────────────────────────────────────────────

function StaffRanking({ staff }: { staff: AdminDashboardResponse["tables"]["top_staff"] }) {
  if (!staff.length) return <p className="text-sm text-[#6b7280]">Brak danych.</p>;
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
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{medals[i] ?? `#${i + 1}`}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                <p className="text-[10px] text-[#6b7280] truncate">{s.email}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-white">{s.completed_repairs} napraw</p>
              <p className="text-[11px] text-[#22c55e]">{fmtPln(s.revenue)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]"
                initial={{ width: 0 }}
                whileInView={{ width: `${(s.completed_repairs / maxRep) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
              />
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#06b6d4]"
                initial={{ width: 0 }}
                whileInView={{ width: `${(Number(s.revenue) / maxRev) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-28" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-24" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <SkeletonBox className="col-span-3 h-64" />
        <SkeletonBox className="col-span-2 h-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} className="h-56" />)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const daysParam = Number(searchParams.get("days"));
  const days = DAY_OPTIONS.includes(daysParam as (typeof DAY_OPTIONS)[number]) ? daysParam : 30;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminDashboardResponse>(`/analytics/admin-dashboard/?days=${days}`, token);
      setData(res);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Nie udało się pobrać statystyk."));
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, days]);

  useEffect(() => { void load(); }, [load]);

  const setDays = (d: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("days", String(d));
    router.replace(`${pathname}?${next.toString()}`);
  };

  const kpi = data?.kpi;
  const charts = data?.charts;
  const tables = data?.tables;

  // Prepare chart data (hooks must be before any conditional returns)
  const statusChartData = useMemo(() => {
    if (!charts?.repairs_by_status) return [];
    return Object.entries(charts.repairs_by_status)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value], i) => ({
        key, label: STATUS_LABELS[key] ?? key, value, color: STATUS_COLORS[i % STATUS_COLORS.length],
      }));
  }, [charts]);

  const sourceData = useMemo(() => {
    if (!charts?.repairs_by_source) return [];
    return Object.entries(charts.repairs_by_source)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, label: SOURCE_LABELS[key] ?? key, value, color: SOURCE_COLORS[key] ?? "#6b7280" }));
  }, [charts]);

  const priorityData = useMemo(() => {
    if (!charts?.repairs_by_priority) return [];
    return Object.entries(charts.repairs_by_priority)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, label: PRIORITY_LABELS[key] ?? key, value, color: PRIORITY_COLORS[key] ?? "#6b7280" }));
  }, [charts]);

  const categoryData = useMemo(() => {
    if (!charts?.repairs_by_category) return [];
    return Object.entries(charts.repairs_by_category)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value], i) => ({ key, label: CATEGORY_LABELS[key] ?? key, value, color: STATUS_COLORS[i % STATUS_COLORS.length] }));
  }, [charts]);

  const maxBrand = useMemo(() => Math.max(1, ...(charts?.top_brands ?? []).map((b) => b.count)), [charts]);
  const maxSource = useMemo(() => Math.max(1, ...sourceData.map((d) => d.value)), [sourceData]);
  const maxPriority = useMemo(() => Math.max(1, ...priorityData.map((d) => d.value)), [priorityData]);
  const maxCategory = useMemo(() => Math.max(1, ...categoryData.map((d) => d.value)), [categoryData]);

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-[#fca5a5]">Tylko administrator.</p>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6366f1]">Panel Admina</p>
          <h1 className="mt-1.5 text-2xl font-bold text-white">Statystyki & Analityka</h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            Kompleksowy przegląd KPI, trendów i wydajności serwisu
            {lastUpdated && (
              <> · Odświeżono {lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  days === d
                    ? "bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                {d} dni
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[#9ca3af] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Odśwież
          </button>
        </div>
      </motion.header>

      {error && (
        <div className="mb-2">
          <ErrorState error={error} onRetry={() => void load()} />
        </div>
      )}

      {loading && !data ? (
        <LoadingSkeleton />
      ) : kpi && charts && tables ? (
        <>
          {/* ── Hero KPI Row ── */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">Kluczowe wskaźniki</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                size="lg"
                label="Przychód (zakończone)"
                value={fmtPln(kpi.revenue_total)}
                sub={`Wartość wycen: ${fmtPln(kpi.quote_value_total)}`}
                icon={<DollarSign size={18} />}
                color="#22c55e"
                trend="up"
              />
              <KpiCard
                size="lg"
                label="Zakończone naprawy"
                value={kpi.completed_count}
                sub={`Okres: ${days} dni`}
                icon={<CheckCircle size={18} />}
                color="#3b82f6"
                trend="up"
              />
              <KpiCard
                size="lg"
                label="W toku"
                value={kpi.in_progress_count}
                sub="Aktywnie prowadzone"
                icon={<Activity size={18} />}
                color="#6366f1"
                trend="neutral"
              />
              <KpiCard
                size="lg"
                label="Zaległe (po terminie)"
                value={kpi.overdue_count}
                sub={kpi.overdue_count > 0 ? "Wymagają uwagi!" : "Wszystko na czas"}
                icon={<AlertTriangle size={18} />}
                color={kpi.overdue_count > 0 ? "#ef4444" : "#22c55e"}
                trend={kpi.overdue_count > 0 ? "down" : "up"}
              />
            </div>
          </section>

          {/* ── Secondary KPI Row ── */}
          <section>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Nowe zgłoszenia"
                value={kpi.new_count}
                sub="Czekają na przyjęcie"
                icon={<Zap size={16} />}
                color="#f59e0b"
              />
              <KpiCard
                label="Gotowe do odbioru"
                value={kpi.ready_for_pickup_count}
                sub={`Nieodebrane >7 dni: ${kpi.unclaimed_count}`}
                icon={<Package size={16} />}
                color="#06b6d4"
              />
              <KpiCard
                label="Reklamacje / Gwarancje"
                value={`${kpi.complaints_count} / ${kpi.warranties_count}`}
                sub="Aktywne w serwisie"
                icon={<XCircle size={16} />}
                color="#ec4899"
              />
              <KpiCard
                label="Śr. czas realizacji"
                value={kpi.avg_completion_days != null ? `${kpi.avg_completion_days} dni` : "—"}
                sub="Od przyjęcia do zakończenia"
                icon={<Clock size={16} />}
                color="#8b5cf6"
              />
            </div>
          </section>

          {/* ── Main Chart: Area + Donut ── */}
          <section className="grid gap-4 lg:grid-cols-5">
            <SectionCard
              className="lg:col-span-3"
              title="Naprawy w czasie"
              subtitle={`Dzienna liczba nowych napraw (ostatnie ${days} dni)`}
              badge={
                <span className="rounded-full bg-[#6366f1]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#6366f1]">
                  {data.charts.repairs_over_time.length} dni danych
                </span>
              }
            >
              <AreaLineChart points={charts.repairs_over_time} />
            </SectionCard>

            <SectionCard
              className="lg:col-span-2"
              title="Rozkład statusów"
              subtitle="Naprawy wg bieżącego statusu"
            >
              <div className="flex flex-col items-center">
                <DonutChart data={statusChartData} label="łącznie" />
                <div className="mt-3 w-full space-y-1.5">
                  {statusChartData.slice(0, 6).map((d) => (
                    <div key={d.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
                        <span className="truncate text-[11px] text-[#9ca3af]">{d.label}</span>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </section>

          {/* ── Brands / Sources / Categories ── */}
          <section className="grid gap-4 lg:grid-cols-3">
            {/* Top Brands */}
            <SectionCard
              title="Top marki"
              subtitle="Najczęściej naprawiane marki"
              badge={<BarChart3 size={14} className="text-[#6b7280]" />}
            >
              {charts.top_brands && charts.top_brands.length > 0 ? (
                <div className="space-y-3">
                  {charts.top_brands.map((b) => (
                    <HBar
                      key={b.name}
                      label={b.name}
                      value={b.count}
                      max={maxBrand}
                      color={`linear-gradient(90deg, #6366f1, #3b82f6)`}
                      sub={fmtPln(b.revenue)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Brak danych o markach.</p>
              )}
            </SectionCard>

            {/* Sources */}
            <SectionCard
              title="Źródła zgłoszeń"
              subtitle="Skąd trafiają klienci"
              badge={<Target size={14} className="text-[#6b7280]" />}
            >
              {sourceData.length > 0 ? (
                <div className="space-y-3">
                  {sourceData.map((s) => (
                    <HBar
                      key={s.key}
                      label={s.label}
                      value={s.value}
                      max={maxSource}
                      color={s.color}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Brak danych.</p>
              )}
            </SectionCard>

            {/* Categories */}
            <SectionCard
              title="Kategorie urządzeń"
              subtitle="Rozkład wg typu sprzętu"
            >
              {categoryData.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.map((c) => (
                    <HBar
                      key={c.key}
                      label={c.label}
                      value={c.value}
                      max={maxCategory}
                      color={c.color}
                      icon={CATEGORY_ICONS[c.key]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Brak danych.</p>
              )}
            </SectionCard>
          </section>

          {/* ── Priority + Top Models ── */}
          <section className="grid gap-4 lg:grid-cols-5">
            {/* Priority */}
            <SectionCard
              className="lg:col-span-2"
              title="Priorytety"
              subtitle="Rozkład pilności zgłoszeń"
            >
              {priorityData.length > 0 ? (
                <div className="space-y-3">
                  {priorityData.map((p) => (
                    <HBar
                      key={p.key}
                      label={p.label}
                      value={p.value}
                      max={maxPriority}
                      color={p.color}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Brak danych.</p>
              )}
            </SectionCard>

            {/* Top Models */}
            <SectionCard
              className="lg:col-span-3"
              title="Top modele urządzeń"
              subtitle="Najczęściej naprawiane modele w wybranym okresie"
              badge={<Smartphone size={14} className="text-[#6b7280]" />}
            >
              {charts.top_models && charts.top_models.length > 0 ? (
                <div className="divide-y divide-white/[0.05]">
                  {charts.top_models.map((m, i) => (
                    <motion.div
                      key={`${m.brand}-${m.model}`}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 shrink-0 text-center text-[11px] font-bold text-[#4b5563]">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{m.model}</p>
                          <p className="text-[11px] text-[#6b7280]">{m.brand}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="h-1.5 w-16 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#3b82f6]"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(m.count / (charts.top_models?.[0]?.count || 1)) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 + i * 0.04 }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-white w-6 text-right">{m.count}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Brak danych o modelach (wybierz dłuższy okres).</p>
              )}
            </SectionCard>
          </section>

          {/* ── Staff Ranking ── */}
          <SectionCard
            title="Ranking pracowników"
            subtitle={`Zakończone naprawy i przychód w ciągu ${days} dni`}
            badge={<Award size={14} className="text-[#f59e0b]" />}
          >
            <StaffRanking staff={tables.top_staff} />
          </SectionCard>

          {/* ── Operational Tables ── */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">Tabele operacyjne</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard
                title="Najbardziej zaległe"
                subtitle="Naprawy po terminie — sortowane najstarszymi"
                badge={<AlertTriangle size={13} className="text-[#ef4444]" />}
              >
                {tables.most_overdue.length > 0 ? (
                  tables.most_overdue.map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="py-4 text-center text-sm text-[#22c55e]">Brak zaległości!</p>
                )}
              </SectionCard>

              <SectionCard
                title="Długo nieodebrane"
                subtitle="Gotowe do odbioru ponad 7 dni"
                badge={<Clock size={13} className="text-[#f59e0b]" />}
              >
                {tables.unclaimed_repairs.length > 0 ? (
                  tables.unclaimed_repairs.map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="py-4 text-center text-sm text-[#22c55e]">Brak nieodebranych!</p>
                )}
              </SectionCard>

              <SectionCard
                title="Aktywne reklamacje"
                subtitle="Otwarte sprawy reklamacyjne"
                badge={
                  <Link href="/admin-panel/claims" className="text-[11px] font-semibold text-[#6366f1] hover:underline">
                    Wszystkie →
                  </Link>
                }
              >
                {tables.active_complaints.length > 0 ? (
                  tables.active_complaints.map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="py-4 text-center text-sm text-[#6b7280]">Brak reklamacji.</p>
                )}
              </SectionCard>

              <SectionCard
                title="Aktywne gwarancje"
                subtitle="Otwarte sprawy gwarancyjne"
              >
                {tables.active_warranties.length > 0 ? (
                  tables.active_warranties.map((r) => <RepairRow key={r.id} r={r} />)
                ) : (
                  <p className="py-4 text-center text-sm text-[#6b7280]">Brak gwarancji.</p>
                )}
              </SectionCard>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
