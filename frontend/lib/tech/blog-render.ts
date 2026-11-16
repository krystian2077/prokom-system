/**
 * Markdown-ish post content → HTML for the Tech skin (`.t-prose`). Same syntax as the old
 * renderer (##, ###, **bold**, `code`, [link](url), - and 1. lists, ---, paragraphs);
 * only the markup/classes change, the content stays byte-for-byte (SPEC §12.11).
 */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Only site-relative and http(s) links; everything else is rendered as text. */
function safeHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return null;
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
      const safe = safeHref(href.replace(/&amp;/g, "&"));
      if (!safe) return label;
      const ext = /^https?:/i.test(safe) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(safe)}"${ext}>${label}</a>`;
    });
}

const CONTACT_LINE = /^\*\*(Zadzwoń|Adres|Tel|Telefon):\*\*/;

export function renderPostContent(raw: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para = false;
  const closePara = () => {
    if (para) out.push("</p>");
    para = false;
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  const openList = (kind: "ul" | "ol") => {
    if (list !== kind) {
      closeList();
      out.push(`<${kind}>`);
      list = kind;
    }
  };

  for (const line of raw.split("\n")) {
    // Legacy posts end with a hard-coded "**Zadzwoń:** … / **Adres:** …" block (Rabka only).
    // Contact data comes from config/prokom.ts in the page around the post, so these lines are dropped.
    if (CONTACT_LINE.test(line.trim())) continue;
    if (line.startsWith("## ")) {
      closePara();
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closePara();
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    const ordered = line.match(/^(\d+)\. (.+)$/);
    if (ordered) {
      closePara();
      openList("ol");
      out.push(`<li>${inline(ordered[2])}</li>`);
      continue;
    }
    if (line.startsWith("- ")) {
      closePara();
      openList("ul");
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    if (line.trim() === "---") {
      closePara();
      closeList();
      out.push("<hr />");
      continue;
    }
    if (line.trim() === "") {
      closePara();
      closeList();
      continue;
    }
    closeList();
    if (!para) {
      out.push("<p>");
      para = true;
    } else out.push(" ");
    out.push(inline(line));
  }
  closePara();
  closeList();
  return out.join("");
}

export function formatPostDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });
}
