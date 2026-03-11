import { Shield, Phone } from "lucide-react";
import Link from "next/link";

export default function HammerHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-[#0d0e10] text-white">
      {/* Background glows */}
      <div
        className="pointer-events-none absolute -left-[120px] -top-[120px] h-[600px] w-[600px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(220,30,30,0.12) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-full w-1/2"
        style={{
          background:
            "linear-gradient(135deg, transparent 0%, rgba(220,30,30,0.04) 100%)",
        }}
        aria-hidden
      />

      <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col gap-12 px-6 py-16 lg:grid lg:grid-cols-2 lg:gap-64 lg:px-20 lg:py-20">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(220,30,30,0.35)] bg-[rgba(220,30,30,0.16)] px-5 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#dc1e1e]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#dc1e1e]" />
            DOSTĘPNE W SERWISIE PRO-KOM
          </div>

          {/* Tag */}
          <p className="mb-3 mt-4 font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-[#3a3d44]">
            HAMMER GLASS CUT
          </p>

          {/* Heading */}
          <h1
            className="mb-5 font-syne text-white leading-[1.04] tracking-[-0.02em] font-extrabold"
            style={{ fontSize: "clamp(36px,4.5vw,62px)" }}
          >
            Folia ochronna
            <br />
            wycinana{" "}
            <span className="not-italic text-[#dc1e1e]">precyzyjnie</span>
            <br />
            na miejscu.
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-[420px] text-[16px] leading-[1.75] text-[#555]">
            Ploter Hammer Glass CUT wycina folię perfekcyjnie dopasowaną do
            Twojego urządzenia — w kilkadziesiąt sekund. Zero kompromisów,
            pełna ochrona do 0,1 mm dokładności.
          </p>

          {/* Stats */}
          <div className="mb-11 flex flex-wrap items-start gap-7 text-sm">
            {[
              { value: "10K+", label: "modeli urządzeń" },
              { value: "9", label: "rodzajów folii" },
              { value: "~5 min", label: "montaż na miejscu" },
              { value: "0.1 mm", label: "precyzja cięcia" },
            ].map((item, index) => (
              <div key={item.label} className="flex items-start gap-4">
                {index !== 0 && (
                  <span className="mt-1 hidden h-10 w-px bg-white/8 sm:block" />
                )}
                <div>
                  <div className="font-syne text-[28px] font-bold tracking-[-0.01em] text-white">
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#444]">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="#folie"
              className="inline-flex items-center gap-2 rounded-xl bg-[#dc1e1e] px-[26px] py-[13px] text-[14px] font-bold text-white shadow-[0_4px_20px_rgba(220,30,30,0.35)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(220,30,30,0.48)]"
            >
              <Shield className="h-4 w-4" aria-hidden />
              Zobacz folie
            </Link>
            <Link
              href="tel:883200151"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-6 py-[13px] text-[14px] font-semibold text-[#888] transition-all duration-200 hover:border-white/25 hover:text-[#ccc]"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Umów wizytę
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="flex items-center justify-center px-4 py-10 lg:ml-10 lg:pl-10 lg:pr-0 lg:py-16">
          <div className="relative w-full max-w-[480px]">
            {/* Phone mockup */}
            <div className="mx-auto w-[240px] animate-float">
              <div className="rounded-[36px] bg-gradient-to-br from-[#1a1d23] to-[#0d0e10] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_rgba(0,0,0,0.6),0_40px_100px_rgba(220,30,30,0.1)]">
                <div className="relative flex h-[470px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1e2128] to-[#13151a]">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(220,30,30,0.06)] to-transparent" />
                  <div className="relative z-10 text-center">
                    <p className="font-syne text-[13px] font-black tracking-[0.08em] text-white">
                      HAMMER <span className="text-[#dc1e1e]">GLASS</span>
                    </p>
                  </div>
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="flex h-24 w-20 items-center justify-center rounded-t-xl rounded-b-[50%] border-2 border-[rgba(220,30,30,0.3)] bg-gradient-to-br from-[rgba(220,30,30,0.15)] to-[rgba(220,30,30,0.05)]">
                      <Shield className="h-9 w-9 text-[#dc1e1e]" aria-hidden />
                    </div>
                  </div>
                  <p className="relative z-10 text-[10px] tracking-[0.06em] text-[#333]">
                    PRECYZYJNE CIĘCIE 0.1 MM
                  </p>
                </div>
              </div>
            </div>

            {/* Floating film cards */}
            <div className="pointer-events-none">
              <div className="ff-1 absolute left-[-40px] top-[10%] animate-[float_3.5s_0.5s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Prime Protector
                </p>
                <p className="text-[10px] font-medium text-[#555]">
                  PREMIUM · Samoregeneracja
                </p>
              </div>

              <div className="ff-2 absolute right-[-50px] top-[35%] animate-[float_4s_1s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />
                  Cristal Shield
                </p>
                <p className="text-[10px] font-medium text-[#555]">
                  MEDIUM · UV ochrona
                </p>
              </div>

              <div className="ff-3 absolute bottom-[15%] left-[-30px] animate-[float_3.8s_0.2s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-[#13151a] px-3.5 py-2.5 text-[11px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <p className="mb-0.5 font-semibold text-[#ddd]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-400" />
                  Private View
                </p>
                <p className="text-[10px] font-medium text-[#555]">
                  SPECIAL · Prywatność
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

