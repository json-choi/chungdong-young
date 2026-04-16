import sanitizeHtmlLib from "sanitize-html";

// Keep this allow-list in sync with the Tiptap extensions enabled in
// `src/components/admin/tiptap-editor.tsx`. Anything the editor can produce
// should be representable here; everything else gets stripped.
const ALLOWED_TAGS = [
  // Text blocks
  "p",
  "br",
  "h2",
  "h3",
  "blockquote",
  "hr",
  // Inline marks
  "strong",
  "em",
  "u",
  "s",
  "b",
  "i",
  "mark",
  "sup",
  "sub",
  "span",
  "a",
  // Lists
  "ul",
  "ol",
  "li",
  // Tables
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  // Task list renders as <ul data-type="taskList"><li data-type="taskItem"><label><input/></label>
  "label",
  "input",
  "div",
  // YouTube embed
  "iframe",
  // Inline images that may be emitted by future emoji/sticker extensions
  "img",
];

const ALLOWED_ATTR: sanitizeHtmlLib.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  span: ["style", "data-emoji", "data-name", "data-type"],
  mark: ["data-color"],
  p: ["style"],
  h2: ["style"],
  h3: ["style"],
  // Tiptap writes data-type on task lists, details, etc.
  ul: ["data-type"],
  li: ["data-type", "data-checked"],
  div: ["data-type"],
  table: ["style"],
  colgroup: ["style"],
  col: ["style", "span"],
  th: ["colspan", "rowspan", "colwidth", "style"],
  td: ["colspan", "rowspan", "colwidth", "style"],
  // Task list checkbox rendered inside labels
  input: ["type", "checked", "disabled"],
  label: [],
  iframe: [
    "src",
    "width",
    "height",
    "frameborder",
    "allow",
    "allowfullscreen",
    "title",
    "loading",
  ],
  img: ["src", "alt", "title", "width", "height"],
};

// Only allow style properties we expect the editor to emit — values are
// pattern-checked so inline CSS cannot smuggle expressions or URLs.
const ALLOWED_STYLES: sanitizeHtmlLib.IOptions["allowedStyles"] = {
  "*": {
    "text-align": [/^(left|right|center|justify)$/],
    color: [
      /^#(?:[0-9a-fA-F]{3}){1,2}$/,
      /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
      /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)$/,
    ],
    "background-color": [
      /^#(?:[0-9a-fA-F]{3}){1,2}$/,
      /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
    ],
    width: [/^\d+(?:\.\d+)?(?:px|%)$/],
    "min-width": [/^\d+(?:\.\d+)?(?:px|%)$/],
  },
};

// Only youtube.com and youtube-nocookie.com iframes are allowed through.
const ALLOWED_IFRAME_HOSTNAMES = ["www.youtube.com", "www.youtube-nocookie.com"];

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}
