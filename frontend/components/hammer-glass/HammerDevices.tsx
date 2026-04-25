import Image from "next/image";

export default function HammerDevices() {
  const cards = [
    {
      image: "/images/urzadzenia2/iphone.png",
      alt: "Smartfon z folią ochronną",
      title: "Telefony",
      desc: "Apple, Samsung, Xiaomi i inne",
    },
    {
      image: "/images/urzadzenia2/ipadjpg.png",
      alt: "Tablet z folią ochronną",
      title: "Tablety",
      desc: "iPad, Galaxy Tab i inne",
    },
    {
      image: "/images/repairs/smartwatch.jpg",
      alt: "Smartwatch z folią ochronną",
      title: "Smartwatche",
      desc: "Apple Watch, Galaxy Watch",
    },
  ];

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-20">
        <div className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e11d1d] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
            Kompatybilność
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-[#0d0d0d] sm:text-5xl lg:text-[3rem]">
            Folie dla{" "}
            <span className="not-italic text-[#e11d1d]">każdego urządzenia</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[480px] text-[15px] leading-[1.7] text-slate-500 lg:text-[#999]">
            Baza 10 000+ modeli — telefonów, tabletów i smartwatchy wszystkich marek.
          </p>
        </div>

        <div className="mx-auto mt-10 lg:mt-20 grid max-w-[1000px] grid-cols-1 gap-3 lg:gap-7 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex cursor-pointer items-center gap-5 lg:gap-7 rounded-[20px] lg:rounded-[22px] border border-slate-100 lg:border-[rgba(0,0,0,0.07)] bg-white lg:bg-[#fafafa] px-5 py-5 lg:px-7 lg:py-7.5 no-underline shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.09)] lg:shadow-none transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(220,30,30,0.25)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-[72px] w-[72px] lg:h-[88px] lg:w-[88px] flex-shrink-0 items-center justify-center rounded-2xl lg:rounded-[24px] border border-slate-100 lg:border-[rgba(0,0,0,0.08)] bg-slate-50 lg:bg-white/90">
                <Image
                  src={card.image}
                  alt={card.alt}
                  width={84}
                  height={84}
                  className="h-[56px] w-[56px] lg:h-[72px] lg:w-[72px] object-contain"
                />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#0d0d0d]">
                  {card.title}
                </p>
                <p className="mt-1 lg:mt-1.5 text-[14px] text-slate-500 lg:text-[#777]">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

