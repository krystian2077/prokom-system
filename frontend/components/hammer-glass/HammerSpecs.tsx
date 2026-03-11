import {
  Database,
  Ruler,
  Timer,
  BadgeCheck,
  Droplets,
  ShieldCheck,
  RefreshCw,
  ScanLine,
} from "lucide-react";

export default function HammerSpecs() {
  const left = [
    {
      icon: Database,
      title: "Baza 10 000+ modeli",
      desc: "Telefony, tablety i smartwatche — każdy model precyzyjnie wycięty.",
    },
    {
      icon: Ruler,
      title: "Precyzja 0,1 mm",
      desc: "Idealne dopasowanie do krawędzi ekranu — bez marginesu błędu.",
    },
    {
      icon: Timer,
      title: "Montaż ~5 minut",
      desc: "Cięcie i aplikacja na miejscu — bez bąbelków, sucho.",
    },
    {
      icon: BadgeCheck,
      title: "Certyfikaty PZH + RoHS",
      desc: "Europejskie normy bezpieczeństwa — każda folia spełnia wymogi.",
    },
  ];

  const right = [
    {
      icon: Droplets,
      title: "Powłoka oleofobowa",
      desc: "Każda folia — odporność na odciski palców i smug.",
    },
    {
      icon: ShieldCheck,
      title: "Powłoka antymikrobowa (Premium)",
      desc: "Prime Protector — ochrona przed bakteriami i wirusami.",
    },
    {
      icon: RefreshCw,
      title: "Samoregeneracja",
      desc: "Entry i Premium — drobne zarysowania znikają samoistnie.",
    },
    {
      icon: ScanLine,
      title: "Kompatybilność krawędziowa",
      desc: "Zaokrąglone ekrany — folie idealnie przylegają do krawędzi.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0d0e10] py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse,rgba(220,30,30,0.07)_0%,transparent_65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-20">
        <div className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#dc1e1e]">
            <span className="inline-block h-0.5 w-5 rounded-sm bg-[#dc1e1e]" />
            Ploter Hammer Glass CUT
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3rem]">
            Technologia która gwarantuje
            <br />
            <span className="mt-3 block text-[#dc1e1e] sm:mt-4">
              perfekcyjne dopasowanie
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-[1.7] text-[#9ca3af]">
            Wszystko, co stoi za idealnie dopasowaną folią Hammer Glass CUT —
            od bazy modeli po właściwości materiału.
          </p>
        </div>

        <div className="mt-20 grid max-w-[1120px] grid-cols-1 gap-6 lg:mx-auto lg:grid-cols-2">
          <div>
            <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
              Możliwości plotera
            </p>
            <div className="flex flex-col gap-2.5">
              {left.map((item) => (
                <SpecItem key={item.title} {...item} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
              Właściwości folii
            </p>
            <div className="flex flex-col gap-2.5">
              {right.map((item) => (
                <SpecItem key={item.title} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Database;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-[rgba(220,30,30,0.35)] bg-white/[0.05] px-6 py-5 shadow-[0_0_0_1px_rgba(12,12,14,0.85)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(220,30,30,0.5)] hover:bg-white/[0.09]">
      <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-[999px] border border-[rgba(220,30,30,0.4)] bg-[rgba(220,30,30,0.16)] shadow-[0_0_0_1px_rgba(7,7,9,0.9)]">
        <Icon className="h-4.5 w-4.5 text-white" aria-hidden />
      </div>
      <div>
        <p className="mb-1.5 text-[15px] font-semibold leading-[1.3] text-slate-50">
          {title}
        </p>
        <p className="text-[13px] leading-[1.6] text-slate-300/85">{desc}</p>
      </div>
    </div>
  );
}

