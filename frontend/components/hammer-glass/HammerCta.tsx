import { Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function HammerCta() {
  return (
    <section className="relative overflow-hidden bg-white lg:bg-[#0d0e10] py-16 lg:py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 hidden lg:block"
        style={{
          background:
            "radial-gradient(ellipse,rgba(220,30,30,0.12)_0%,transparent_65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5 text-center lg:px-20">
        <div className="mx-auto max-w-[520px]">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e11d1d]/15 lg:border-[rgba(220,30,30,0.25)] bg-[#e11d1d]/[0.07] lg:bg-[rgba(220,30,30,0.12)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e11d1d]">
            Zamów teraz
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-slate-900 lg:text-white sm:text-5xl lg:text-[3rem]">
            Ochroń swój sprzęt już{" "}
            <span className="not-italic text-[#e11d1d]">dziś.</span>
          </h2>
          <p className="mx-auto mb-8 lg:mb-10 mt-3 max-w-[480px] text-[16px] leading-[1.7] text-slate-500 lg:text-[#a0a8b8]">
            Wpadnij do naszego serwisu w Rabce-Zdroju — wytniemy i założymy folię
            ochronną Hammer Glass CUT w kilka minut.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <Link
              href="tel:883200151"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl lg:rounded-full bg-[#e11d1d] px-7 py-3.5 lg:py-3 text-[15px] lg:text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(225,29,29,0.35)] lg:shadow-[0_4px_20px_rgba(220,30,30,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(225,29,29,0.55)]"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Zadzwoń: 883 200 151
            </Link>
            <Link
              href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl lg:rounded-full border border-slate-200 lg:border-white/20 bg-white lg:bg-transparent px-7 py-3.5 lg:py-3 text-[15px] lg:text-[14px] font-semibold text-slate-700 lg:text-[#e5e7eb] shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none transition-all duration-200 hover:border-white hover:text-white"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              ul. Orkana 16B, Rabka-Zdrój
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

