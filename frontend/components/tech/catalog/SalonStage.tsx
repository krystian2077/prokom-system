import Image from "next/image";
import { stagePieces } from "@/lib/tech/catalog/stage";
import type { Brand } from "@/lib/tech/catalog/types";

/** Salon hero devices (data in lib/tech/catalog/stage.ts). Decorative — the department chips carry the links. */
export function SalonStage({ brand }: { brand: Brand }) {
  const pieces = stagePieces(brand);
  if (pieces.length < 2) return null;
  return (
    <div className={`t-bstage t-bstage--${brand}`} aria-hidden="true" data-salon-stage="">
      <span className="t-bstage__glow" />
      {pieces.map((p) => (
        <span key={p.slug} className={`t-bstage__piece t-bstage__piece--${p.slot}`}>
          <Image src={p.src} alt="" fill sizes={p.slot === "back" ? "(min-width: 1024px) 420px, 70vw" : "(min-width: 1024px) 200px, 30vw"} priority={p.slot === "front"} />
        </span>
      ))}
    </div>
  );
}