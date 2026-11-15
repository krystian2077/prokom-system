import { LabArtPreview } from "@/components/tech/lab/LabArtPreview";
import { LabWizardGrid } from "@/components/tech/lab/LabWizardGrid";

export default function LabKreator() {
  return (
    <section className="t-section">
      <div className="t-container t-lab__wrap">
        <span className="t-eyb">Lab · kreator</span>
        <h1 className="t-h2">Każda usterka na każdym urządzeniu</h1>
        <p className="t-lead">Plakaty (stan statyczny). „Odtwórz” uruchamia wejście i pętlę efektu (maks. 3 cykle).</p>
        <LabArtPreview />
        <LabWizardGrid />
      </div>
    </section>
  );
}
