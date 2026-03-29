/** Wspólne klasy wierszy nawigacji — panel pracownika i administratora. */

export const navLinkMotion =
  "group relative flex touch-manipulation items-center justify-between gap-3 rounded-xl border-l-[3px] px-3 py-2.5 outline-none transition-all duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] motion-safe:active:scale-[0.98] motion-safe:active:duration-75 focus-visible:ring-2 focus-visible:ring-[var(--bb)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--s1)]";

export function navRowClass(active: boolean) {
  return active
    ? `${navLinkMotion} border-[var(--blue)] bg-[var(--bl)] text-[var(--white)] shadow-[inset_0_1px_0_0_rgba(255,255,255,.07),0_0_24px_-12px_rgba(59,130,246,.4)] hover:brightness-[1.03]`
    : `${navLinkMotion} border-transparent bg-transparent text-[var(--ink)] hover:border-[var(--border)] hover:bg-[var(--row-hover)] hover:text-[var(--white)] hover:shadow-[inset_0_0_0_1px_var(--border)] active:bg-[var(--row-hover)]`;
}

export function navIconShell(active: boolean) {
  const shell =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ease-out [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out";
  return active
    ? `${shell} border border-[var(--bb)] bg-[color-mix(in_srgb,var(--blue)_22%,transparent)] text-[var(--white)] shadow-[0_0_18px_rgba(59,130,246,.22)] group-hover:shadow-[0_0_24px_rgba(59,130,246,.35)] group-hover:[&_svg]:scale-[1.05]`
    : `${shell} border border-[var(--border)] bg-[var(--row-hover)] text-[var(--ink2)] group-hover:border-[var(--bb)] group-hover:bg-[var(--bl)] group-hover:text-[var(--white)] group-hover:shadow-[0_0_20px_rgba(59,130,246,.15)] group-hover:[&_svg]:scale-110 group-active:[&_svg]:scale-95`;
}
