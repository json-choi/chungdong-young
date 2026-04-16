import sanitizeHtmlLib from "sanitize-html";

// Keep this allow-list in sync with the Tiptap extensions enabled in
// `src/components/admin/tiptap-editor.tsx`. Anything the editor can produce
// should be representable here; everything else gets stripped.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "blockquote",
  "hr",
  "mark",
];

const ALLOWED_ATTR: sanitizeHtmlLib.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  mark: ["data-color"],
  // Tiptap's text-align extension writes `style="text-align: …"` on these.
  p: ["style"],
  h2: ["style"],
  h3: ["style"],
};

// Only allow the specific style properties we expect the editor to emit.
// Values are pattern-checked so inline CSS can't smuggle expressions.
const ALLOWED_STYLES: sanitizeHtmlLib.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^(left|right|center|justify)$/],
  },
};

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}
