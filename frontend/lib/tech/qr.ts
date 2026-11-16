/**
 * QR code for the success card (SPEC §12.7): generated in the browser, no network.
 * The encoded URL is the public track link WITHOUT phone digits.
 */
import qrcode from "qrcode-generator";

export type QrMatrix = { size: number; dark: (row: number, col: number) => boolean };

export function qrMatrix(text: string): QrMatrix {
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const size = qr.getModuleCount();
  return { size, dark: (r, c) => qr.isDark(r, c) };
}

/** One SVG path ("M x y h1 v1 h-1 z" per dark module) for a viewBox of size + 2·quiet. */
export function qrPath(m: QrMatrix, quiet = 2): string {
  let d = "";
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (m.dark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return d;
}
