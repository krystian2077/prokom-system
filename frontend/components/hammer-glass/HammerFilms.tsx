type Tier = "entry" | "medium" | "premium" | "special";

type Film = {
  tier: Tier;
  name: string;
  thickness: string;
  finish: string;
  selfHealing: boolean;
  featured?: boolean;
  extraProps?: { label: string; value: string }[];
  colSpan?: number;
};

const films: Film[] = [
  { tier: "entry", name: "Active Shield", thickness: "0.18 mm", finish: "Clear", selfHealing: true },
  { tier: "entry", name: "Active Shield Matte", thickness: "0.15 mm", finish: "Matte", selfHealing: true },
  { tier: "medium", name: "Cristal Shield", thickness: "0.15 mm", finish: "Clear", selfHealing: false },
  { tier: "medium", name: "Matte Finish", thickness: "0.16 mm", finish: "Matte", selfHealing: false },
  {
    tier: "medium",
    name: "Cristal UV Shield",
    thickness: "0.15 mm",
    finish: "Clear",
    selfHealing: false,
    extraProps: [{ label: "UV ochrona", value: "✓" }],
  },
  {
    tier: "premium",
    name: "Prime Protector Clear",
    thickness: "0.21 mm",
    finish: "Clear",
    selfHealing: true,
    featured: true,
    extraProps: [{ label: "Antymikrobowa", value: "✓" }],
  },
  {
    tier: "special",
    name: "Private View",
    thickness: "0.16 mm",
    finish: "Matte",
    selfHealing: true,
    extraProps: [{ label: "Prywatność", value: "✓" }],
  },
  {
    tier: "special",
    name: "Tablet Armour",
    thickness: "0.13 mm",
    finish: "Clear",
    selfHealing: true,
    extraProps: [{ label: "Urządzenie", value: "Tablet" }],
  },
  {
    tier: "special",
    name: "Watch Armour",
    thickness: "0.13 mm",
    finish: "Clear",
    selfHealing: true,
    colSpan: 2,
    extraProps: [
      { label: "Wodoodporność", value: "✓" },
      { label: "Urządzenie", value: "Smartwatch" },
    ],
  },
];

const tierConfig: Record<
  Tier,
  { label: string; topColor: string; textColor: string }
> = {
  entry: { label: "Entry", topColor: "bg-slate-400", textColor: "text-slate-400" },
  medium: { label: "Medium", topColor: "bg-blue-400", textColor: "text-blue-400" },
  premium: { label: "Premium", topColor: "bg-amber-400", textColor: "text-amber-500" },
  special: { label: "Special", topColor: "bg-violet-400", textColor: "text-violet-500" },
};

function filledDots(tier: Tier): number {
  switch (tier) {
    case "entry":
      return 2;
    case "medium":
      return 3;
    case "premium":
      return 5;
    case "special":
      return 3;
    default:
      return 3;
  }
}

export default function HammerFilms() {
  return (
    <section id="folie" className="bg-[#fafafa] py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-20">
        <div className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#dc1e1e] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
            Kolekcja folii
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#0d0d0d] sm:text-5xl lg:text-[3rem]">
            9 rodzajów folii —{" "}
            <span className="not-italic text-[#dc1e1e]">
              wybierz idealną ochronę
            </span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[480px] text-[15px] leading-[1.7] text-[#999]">
            Od podstawowej ochrony po premium — każda folia dopasowana precyzyjnie
            do Twojego urządzenia.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-[1140px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {films.map((film) => {
            const tier = tierConfig[film.tier];
            const dots = filledDots(film.tier);
            return (
              <div
                key={film.name}
                className={
                  "relative overflow-hidden rounded-[20px] border-[1.5px] bg-white p-6 transition-all duration-[250ms] hover:-translate-y-[6px] hover:border-[rgba(220,30,30,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] " +
                  (film.featured
                    ? "border-[rgba(220,30,30,0.5)] shadow-[0_4px_20px_rgba(220,30,30,0.12)]"
                    : "border-[rgba(0,0,0,0.07)]") +
                  (film.colSpan === 2 ? " lg:col-span-2" : "")
                }
              >
                <div
                  className={`absolute left-0 right-0 top-0 h-[3px] ${tier.topColor}`}
                />
                {film.featured && (
                  <span className="absolute right-3.5 top-3.5 rounded-full bg-[#dc1e1e] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white">
                    Premium
                  </span>
                )}

                <div
                  className={`${tier.textColor} mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em]`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {tier.label}
                </div>

                <h3 className="mb-2 font-syne text-[15px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#0d0d0d]">
                  {film.name}
                </h3>

                {/* Dots */}
                <div className="mb-4 flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        "h-[7px] w-[7px] rounded-full " +
                        (i < dots ? "bg-[#dc1e1e]" : "bg-[#e5e7eb]")
                      }
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <FilmProp label="Grubość" value={film.thickness} />
                  <FilmProp label="Wykończenie" value={film.finish} />
                  <FilmProp
                    label="Samoregeneracja"
                    value={film.selfHealing ? "Tak" : "Nie"}
                  />
                  {film.extraProps?.map((p) => (
                    <FilmProp key={p.label} label={p.label} value={p.value} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FilmProp({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11.5px]">
      <span className="font-medium text-[#888]">{label}</span>
      <span className="rounded-[5px] bg-[#f5f5f5] px-[7px] py-[2px] text-[11px] font-bold text-[#111]">
        {value}
      </span>
    </div>
  );
}

