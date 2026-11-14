"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { EffectFamily } from "@/lib/tech/wizard-data";
import type { EffectProps } from "./types";

const none = () => null;
/** One lazy chunk per family (PREMIUM §4): only the families a visitor picks are loaded. */
export const EFFECTS: Record<EffectFamily, ComponentType<EffectProps>> = {
  E1: dynamic(() => import("./E1Crack"), { ssr: false, loading: none }),
  E2: dynamic(() => import("./E2Battery"), { ssr: false, loading: none }),
  E3: dynamic(() => import("./E3Charge"), { ssr: false, loading: none }),
  E4: dynamic(() => import("./E4Optics"), { ssr: false, loading: none }),
  E5: dynamic(() => import("./E5Sound"), { ssr: false, loading: none }),
  E6: dynamic(() => import("./E6Press"), { ssr: false, loading: none }),
  E7: dynamic(() => import("./E7Water"), { ssr: false, loading: none }),
  E8: dynamic(() => import("./E8Power"), { ssr: false, loading: none }),
  E9: dynamic(() => import("./E9Display"), { ssr: false, loading: none }),
  E10: dynamic(() => import("./E10Heat"), { ssr: false, loading: none }),
  E11: dynamic(() => import("./E11Perf"), { ssr: false, loading: none }),
  E12: dynamic(() => import("./E12Keys"), { ssr: false, loading: none }),
  E13: dynamic(() => import("./E13Data"), { ssr: false, loading: none }),
  E14: dynamic(() => import("./E14System"), { ssr: false, loading: none }),
  E15: dynamic(() => import("./E15Print"), { ssr: false, loading: none }),
  E16: dynamic(() => import("./E16Connect"), { ssr: false, loading: none }),
  E17: dynamic(() => import("./E17Stick"), { ssr: false, loading: none }),
};
