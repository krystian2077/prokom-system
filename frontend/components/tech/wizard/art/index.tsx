"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ArtKind } from "@/lib/tech/wizard-data";

type ArtProps = { uid: string };
const load: Record<ArtKind, () => Promise<{ default: ComponentType<ArtProps> }>> = {
  phone: () => import("./PhoneArt"),
  tablet: () => import("./TabletArt"),
  watch: () => import("./WatchArt"),
  laptop: () => import("./LaptopArt"),
  pc: () => import("./PcArt"),
  printer: () => import("./PrinterArt"),
  console: () => import("./ConsoleArt"),
  data: () => import("./DataArt"),
  other: () => import("./OtherArt"),
};

/**
 * Device illustrations (direction B), one lazy chunk each — server-rendered where the page
 * renders on the server (sub-page heroes), loaded on demand in the wizard.
 */
export const DEVICE_ART = Object.fromEntries(
  (Object.keys(load) as ArtKind[]).map((k) => [k, dynamic(load[k], { loading: () => <span className="t-art t-art--wait" /> })]),
) as Record<ArtKind, ComponentType<ArtProps>>;

/** Warm a device's chunk (hover / focus on its chip). */
export function preloadArt(kind: ArtKind | undefined) {
  if (kind) void load[kind]();
}

export function DeviceArt({ kind, uid }: { kind: ArtKind; uid: string }) {
  const A = DEVICE_ART[kind];
  return <A uid={uid} />;
}
