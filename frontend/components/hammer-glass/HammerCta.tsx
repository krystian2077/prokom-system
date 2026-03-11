import { Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function HammerCta() {
  return (
    <section className="relative overflow-hidden bg-[#0d0e10] py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse,rgba(220,30,30,0.12)_0%,transparent_65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 text-center lg:px-20">
        <div className="mx-auto max-w-[520px]">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(220,30,30,0.25)] bg-[rgba(220,30,30,0.12)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#dc1e1e]">
            Zamów teraz
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3rem]">
            Ochroń swój sprzęt już{" "}
            <span className="not-italic text-[#dc1e1e]">dziś.</span>
          </h2>
          <p className="mx-auto mb-10 mt-3 max-w-[480px] text-[16px] leading-[1.7] text-[#444]">
            Wpadnij do naszego serwisu w Rabce-Zdroju — wytniemy i założymy folię
            ochronną Hammer Glass CUT w kilka minut.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="tel:883200151"
              className="inline-flex items-center gap-2 rounded-full bg-[#dc1e1e] px-7 py-3 text-[14px] font-semibold text-white shadow-[0_4px_20px_rgba(220,30,30,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(220,30,30,0.55)]"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Zadzwoń: 883 200 151
            </Link>
            <Link
              href="https://www.google.com/maps/dir/?api=1&destination=Orkana+16B,+34-700+Rabka-Zdr%C3%B3j"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-7 py-3 text-[14px] font-semibold text-[#e5e7eb] transition-all duration-200 hover:border-white hover:text-white"
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

