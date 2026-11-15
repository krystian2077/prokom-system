/**
 * Icons of the side rail and the search results — the Tech stroke set (icons.tsx: 24 px box,
 * round caps and joins, currentColor). Paths reused from HOME_PATHS / PAGE_PATHS / DEVICE_PATHS
 * where they exist, the rest drawn in the same style.
 */
import type { RailIconName } from "@/lib/tech/rail";
import type { SearchIconName } from "@/lib/tech/search/provider";
import { HOME_PATHS } from "./icons";
import { PAGE_PATHS } from "./page-icons";

type P = { size?: number; strokeWidth?: number; className?: string };

const svgProps = (size: number, sw: number, className?: string) => ({
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

const D = {
  home: "M3 11 12 3l9 8M5 10v10h14V10",
  devices: "M3 5h12v9H3zM1.5 17h15M17 8h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM19 17h.01",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.3-2.3z",
  steps: "M4 6h4v4H4zM10 8h10M4 14h4v4H4zM10 16h6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9M7.5 5.2l9 4.6",
  doc: "M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v5h5M9 13h6M9 17h4",
  chat: "M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5",
  symptom: "M3 12h4l2-5 4 10 2-5h6",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01",
  layers: "m12 3 9 5-9 5-9-5zM3 13l9 5 9-5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6",
  form: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h3",
  warning: "M12 3 2 20h20zM12 10v4M12 17h.01",
  data: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  track: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM9.5 10l2 2 3.5-3.5",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  page: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h3",
  phone: "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  laptop: "M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1zM2 18h20",
  tablet: "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  pc: "M3 4h18v12H3zM8 20h8M12 16v4",
  console: "M6 11h4M8 9v4M15 12h.01M18 10h.01M7 6h10a5 5 0 0 1 5 5v1a4 4 0 0 1-7 2.7L14 14h-4l-1 .7A4 4 0 0 1 2 12v-1a5 5 0 0 1 5-5z",
  printer: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  watch: "M9 2h6l1 4H8zM8 18h8l-1 4H9zM12 9v3l1.5 1.5M7 6h10v12H7z",
} as const;

const RAIL: Record<RailIconName, string> = {
  start: D.home,
  flag: "M5 21V4M5 4h12l-2.5 4L17 12H5",
  devices: D.devices,
  wrench: D.wrench,
  pin: PAGE_PATHS.pin,
  steps: D.steps,
  shield: HOME_PATHS.shield,
  star: HOME_PATHS.star,
  map: HOME_PATHS.map,
  help: HOME_PATHS.help,
  clock: D.clock,
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l2.5 2.5L16 9.5",
  list: HOME_PATHS.list,
  box: D.box,
  truck: HOME_PATHS.truck,
  doc: D.doc,
  chat: D.chat,
  symptom: D.symptom,
  data: D.data,
  tag: D.tag,
  bulb: D.bulb,
  info: D.info,
  layers: D.layers,
  link: D.link,
  user: D.user,
  form: D.form,
  warning: D.warning,
};

const SEARCH: Record<SearchIconName, string> = {
  page: D.page,
  phone: D.phone,
  laptop: D.laptop,
  tablet: D.tablet,
  pc: D.pc,
  console: D.console,
  printer: D.printer,
  watch: D.watch,
  data: D.data,
  wrench: D.wrench,
  pin: PAGE_PATHS.pin,
  help: HOME_PATHS.help,
  doc: D.doc,
  track: D.track,
  call: PAGE_PATHS.phone,
  truck: HOME_PATHS.truck,
  shield: HOME_PATHS.shield,
  user: D.user,
  map: HOME_PATHS.map,
};

export const RailIcon = ({ icon, size = 22, strokeWidth = 1.9, className }: P & { icon: RailIconName }) => (
  <svg {...svgProps(size, strokeWidth, className)}>
    <path d={RAIL[icon]} />
  </svg>
);

export const SearchIcon = ({ icon, size = 18, strokeWidth = 2, className }: P & { icon: SearchIconName }) => (
  <svg {...svgProps(size, strokeWidth, className)}>
    <path d={SEARCH[icon]} />
  </svg>
);

export const IconToTop = ({ size = 22, strokeWidth = 1.9, className }: P) => (
  <svg {...svgProps(size, strokeWidth, className)}>
    <path d={D.arrowUp} />
  </svg>
);

export const IconClock = ({ size = 16, strokeWidth = 2, className }: P) => (
  <svg {...svgProps(size, strokeWidth, className)}>
    <path d={D.clock} />
  </svg>
);
