/** Inline icons from the design (stroke style, currentColor). */
import type { DeviceIcon } from "@/lib/tech/nav";

type P = { size?: number; strokeWidth?: number; className?: string };
const base = (size: number, sw: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  className,
});

export const IconArrow = ({ size = 15, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconChevronDown = ({ size = 13, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconChevronRight = ({ size = 16, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconUser = ({ size = 17, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconMoon = ({ size = 18, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
);
export const IconSun = ({ size = 18, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IconWrench = ({ size = 16, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.3-2.3z" /></svg>
);
export const IconSearch = ({ size = 19, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconHome = ({ size = 21, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M3 11 12 3l9 8M5 10v10h14V10" /></svg>
);
export const IconPin = ({ size = 20, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" /></svg>
);
export const IconMenu = ({ size = 21, strokeWidth = 2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconPlus = ({ size = 24, strokeWidth = 2.6, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconClose = ({ size = 18, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconCheck = ({ size = 15, strokeWidth = 2.8, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconArrowUpRight = ({ size = 14, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const IconArrowUp = ({ size = 12, strokeWidth = 2.4, className }: P) => (
  <svg {...base(size, strokeWidth, className)}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
);

export const IconPhoneCall = ({ size = 18, strokeWidth = 2.2, className }: P) => (
  <svg {...base(size, strokeWidth, className)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

/** Path icons from the home page design (T.Main `I`). */
export const HOME_PATHS = {
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  crack: "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM10 6l3 4-2 3 3 5",
  batt: "M3 8h15v8H3zM21 11v2M7 11v2",
  plug: "M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5",
  drop: "M12 2.7S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.3-7-12.3z",
  spk: "M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13",
  back: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9.5 5.5h3v3h-3z",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  back2: "M15 18l-6-6 6-6",
} as const;
export type HomeIcon = keyof typeof HOME_PATHS;
export const IconPath = ({ icon, size = 20, strokeWidth = 2, className }: P & { icon: HomeIcon }) => (
  <svg {...base(size, strokeWidth, className)}><path d={HOME_PATHS[icon]} /></svg>
);

const DEVICE_PATHS: Record<DeviceIcon, string> = {
  phone: "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  laptop: "M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1zM2 18h20",
  tablet: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  pc: "M3 4h18v12H3zM8 20h8M12 16v4",
  console: "M6 11h4M8 9v4M15 12h.01M18 10h.01M7 6h10a5 5 0 0 1 5 5v1a4 4 0 0 1-7 2.7L14 14h-4l-1 .7A4 4 0 0 1 2 12v-1a5 5 0 0 1 5-5z",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  watch: "M9 2h6l1 4H8zM8 18h8l-1 4H9zM12 9v3l1.5 1.5M7 6h10v12H7z",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
};
export const DeviceGlyph = ({ icon, size = 20, strokeWidth = 2, className }: P & { icon: DeviceIcon }) => (
  <svg {...base(size, strokeWidth, className)}><path d={DEVICE_PATHS[icon]} /></svg>
);
