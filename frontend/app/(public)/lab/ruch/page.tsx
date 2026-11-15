import { LabMotion } from "@/components/tech/lab/LabMotion";

export default function LabRuch() {
  return (
    <section className="t-section">
      <div className="t-container t-lab__wrap">
        <span className="t-eyb">Lab · ruch</span>
        <h1 className="t-h2">System ruchu</h1>
        <p className="t-lead">Tokeny i wzorce z tech-motion.css (PREMIUM §1). Wszystko respektuje ograniczony ruch.</p>
        <LabMotion />
      </div>
    </section>
  );
}
