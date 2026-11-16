import { LabMenu } from "@/components/tech/lab/LabMenu";

export default function LabMenuPage() {
  return (
    <section className="t-section">
      <div className="t-container t-lab__wrap">
        <span className="t-eyb">Lab · nawigacja</span>
        <h1 className="t-h2">Kapsuła, mega menu i arkusz</h1>
        <LabMenu />
      </div>
    </section>
  );
}
