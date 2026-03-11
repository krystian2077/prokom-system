type TierType = "entry" | "medium" | "premium" | "special";

type CellValue = boolean | string;

const columns: {
  tier: TierType;
  name: string;
  short: string;
  isPremium?: boolean;
}[] = [
  { tier: "entry", name: "Active Shield", short: "Active Shield" },
  { tier: "entry", name: "Shield Matte", short: "Shield Matte" },
  { tier: "medium", name: "Cristal Shield", short: "Cristal Shield" },
  { tier: "medium", name: "Matte Finish", short: "Matte Finish" },
  { tier: "medium", name: "Cristal UV", short: "Cristal UV" },
  { tier: "premium", name: "Prime Clear", short: "Prime Clear", isPremium: true },
  { tier: "premium", name: "Prime Matte", short: "Prime Matte", isPremium: true },
  { tier: "special", name: "Private View", short: "Private View" },
  { tier: "special", name: "Nanoglass", short: "Nanoglass" },
];

const rows: { label: string; highlight?: boolean; values: CellValue[] }[] = [
  {
    label: "Grubość",
    values: [
      "0.18mm",
      "0.15mm",
      "0.15mm",
      "0.16mm",
      "0.15mm",
      "0.21mm",
      "0.21mm",
      "0.16mm",
      "ultra",
    ],
  },
  {
    label: "Materiał",
    values: ["IPU", "TPU", "PET", "PET", "PET", "PC+PU+PET", "PC+PU+PET", "TPU", "Nano"],
  },
  {
    label: "Wykończenie",
    values: [
      "Clear",
      "Matte",
      "Clear",
      "Matte",
      "Clear",
      "Clear",
      "Matte",
      "Matte",
      "Clear",
    ],
  },
  {
    label: "Samoregeneracja",
    values: [true, true, false, false, false, true, true, true, false],
  },
  {
    label: "Powłoka oleofobowa",
    values: [true, true, true, true, true, true, true, true, true],
  },
  {
    label: "Powłoka antymikrobowa",
    highlight: true,
    values: [false, false, false, false, false, true, true, false, false],
  },
  {
    label: "UV wzmocnienie",
    values: [false, false, false, false, true, false, false, false, false],
  },
  {
    label: "Filtr prywatności",
    values: [false, false, false, false, false, false, false, true, false],
  },
  {
    label: "Antyżółknięcie",
    values: [true, true, true, true, true, true, true, true, true],
  },
  {
    label: "Zaokrąglone ekrany",
    values: [true, true, true, true, true, true, true, true, true],
  },
  {
    label: "Certyfikaty",
    values: Array(columns.length).fill("PZH·RoHS"),
  },
];

const tierColor: Record<TierType, string> = {
  entry: "text-slate-400",
  medium: "text-blue-400",
  premium: "text-amber-500",
  special: "text-violet-500",
};

function renderCell(value: CellValue, isPremium?: boolean) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="text-[16px] font-bold text-green-500">✓</span>
    ) : (
      <span className="text-[15px] text-[#d1d5db]">✗</span>
    );
  }
  return (
    <span
      className={
        "inline-block rounded-[6px] px-2.5 py-[3px] text-[11px] font-bold " +
        (isPremium && value !== "—"
          ? "bg-[rgba(220,30,30,0.08)] text-[#dc1e1e]"
          : "bg-[#f5f5f5] text-[#555]")
      }
    >
      {value}
    </span>
  );
}

export default function HammerCompare() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-20">
        <div className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#dc1e1e] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
            Pełne porównanie
          </span>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#0d0d0d] sm:text-5xl lg:text-[3rem]">
            Wszystkie parametry
            <br />
            <span className="mt-3 block text-[#dc1e1e] sm:mt-4">
              w jednym miejscu
            </span>
          </h2>
        </div>

        <div className="mt-14 overflow-hidden rounded-[18px] border border-[rgba(0,0,0,0.09)] shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse bg-white">
              <thead className="bg-[#fafafa] border-b-2 border-[rgba(0,0,0,0.08)]">
                <tr>
                  <th className="sticky left-0 min-w-[160px] border-none bg-[#fafafa] px-4 py-4 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-[#bbb]">
                    Parametr
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className={
                        "border-l border-[rgba(0,0,0,0.06)] px-3.5 py-4 text-center " +
                        (col.isPremium ? "bg-amber-50/40" : "")
                      }
                    >
                      <span
                        className={
                          "mb-0.5 block text-[8px] font-bold uppercase tracking-[0.12em] " +
                          tierColor[col.tier]
                        }
                      >
                        {col.tier.toUpperCase()}
                      </span>
                      <span className="block text-[12px] font-extrabold leading-[1.2] tracking-[-0.01em] text-[#222]">
                        {col.short}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.label}
                    className={
                      "border-b border-[rgba(0,0,0,0.05)] last:border-none " +
                      (row.highlight
                        ? "bg-amber-50/20 hover:bg-amber-50/30"
                        : "hover:bg-[#fafafa]")
                    }
                  >
                    <td
                      className={
                        "sticky left-0 z-10 border-r border-[rgba(0,0,0,0.07)] px-4 py-3 text-left text-[13px] font-semibold " +
                        (row.highlight
                          ? "bg-amber-50/50 text-amber-900"
                          : "bg-white text-[#444]")
                      }
                    >
                      {row.label}
                    </td>
                    {row.values.map((value, index) => {
                      const col = columns[index];
                      return (
                        <td
                          key={col.name + row.label}
                          className={
                            "border-l border-[rgba(0,0,0,0.05)] px-3.5 py-3 text-center " +
                            (col.isPremium ? "bg-amber-50/20" : "")
                          }
                        >
                          {renderCell(value, col.isPremium)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

