import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purify = DOMPurify(window as any);

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "b",
  "i",
];

const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
