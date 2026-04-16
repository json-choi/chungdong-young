"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { offset } from "@floating-ui/dom";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Link2Off,
  Undo2,
  Redo2,
  Eraser,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Palette,
  PlayCircle as YoutubeIcon,
  Table as TableIcon,
  TableProperties,
  GripVertical,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHARACTER_LIMIT = 10000;

const COLOR_SWATCHES = [
  { label: "기본", value: "" },
  { label: "빨강", value: "#D4453F" },
  { label: "주황", value: "#D07013" },
  { label: "초록", value: "#2C7A4B" },
  { label: "파랑", value: "#1C4E80" },
  { label: "보라", value: "#6A4BA8" },
  { label: "회색", value: "#4B5563" },
] as const;

// Translucent backgrounds look good in both light and dark mode because the
// underlying text color shows through unchanged.
const HIGHLIGHT_SWATCHES = [
  { label: "없음", value: "" },
  { label: "노랑", value: "rgba(234, 179, 8, 0.32)" },
  { label: "연두", value: "rgba(132, 204, 22, 0.3)" },
  { label: "하늘", value: "rgba(56, 189, 248, 0.32)" },
  { label: "분홍", value: "rgba(244, 114, 182, 0.32)" },
  { label: "보라", value: "rgba(168, 85, 247, 0.32)" },
  { label: "주황", value: "rgba(249, 115, 22, 0.3)" },
] as const;

const TABLE_PICKER_ROWS = 6;
const TABLE_PICKER_COLS = 8;

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "공지 내용을 입력하세요…",
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      CharacterCount.configure({ limit: CHARACTER_LIMIT }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Typography,
      TextStyle,
      Color.configure({ types: [TextStyle.name] }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: { class: "tiptap-table" },
        },
      }),
      Youtube.configure({
        inline: false,
        nocookie: true,
        controls: true,
        HTMLAttributes: { class: "tiptap-youtube" },
      }),
      Emoji.configure({
        emojis: gitHubEmojis,
        enableEmoticons: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.isDestroyed) return;
    if (content === editor.getHTML()) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border rounded-md min-h-[260px] bg-church-border-soft/30" />
    );
  }

  return (
    <div className="border rounded-md bg-church-surface relative">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <Footer editor={editor} />

      <BubbleMenu
        editor={editor}
        options={{ offset: 8, placement: "top" }}
        className="tiptap-bubble flex items-center gap-0.5 rounded-md border border-church-border bg-church-surface p-1 shadow-lg"
      >
        <ToolButton
          label="굵게"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          compact
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          label="기울임"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          compact
        >
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton
          label="밑줄"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          compact
        >
          <UnderlineIcon className="size-4" />
        </ToolButton>
        <ToolButton
          label="형광펜 (노랑)"
          active={editor.isActive("highlight")}
          onClick={() => {
            if (editor.isActive("highlight")) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              editor
                .chain()
                .focus()
                .setHighlight({ color: "rgba(234, 179, 8, 0.32)" })
                .run();
            }
          }}
          compact
        >
          <Highlighter className="size-4" />
        </ToolButton>
        <ToolButton
          label="링크"
          active={editor.isActive("link")}
          onClick={() => insertLinkViaPrompt(editor)}
          compact
        >
          <LinkIcon className="size-4" />
        </ToolButton>
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        options={{ offset: 4, placement: "left-start" }}
        className="tiptap-floating flex items-center gap-0.5 rounded-md border border-church-border bg-church-surface p-1 shadow-sm"
      >
        <ToolButton
          label="제목 2"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          compact
        >
          <Heading2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="제목 3"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          compact
        >
          <Heading3 className="size-4" />
        </ToolButton>
        <ToolButton
          label="글머리 기호"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          compact
        >
          <List className="size-4" />
        </ToolButton>
        <ToolButton
          label="체크리스트"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          compact
        >
          <ListChecks className="size-4" />
        </ToolButton>
        <ToolButton
          label="인용문"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          compact
        >
          <Quote className="size-4" />
        </ToolButton>
      </FloatingMenu>

      <DragHandle
        editor={editor}
        className="tiptap-drag-handle"
        computePositionConfig={{ middleware: [offset({ mainAxis: 8 })] }}
      >
        <GripVertical className="size-4 text-church-muted" />
      </DragHandle>
    </div>
  );
}

function insertLinkViaPrompt(editor: Editor) {
  const previousUrl = (editor.getAttributes("link")?.href as string) ?? "";
  const url = window.prompt("링크 주소를 입력하세요", previousUrl);
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
}

function insertYoutubeViaPrompt(editor: Editor) {
  const url = window.prompt(
    "유튜브 영상 URL을 입력하세요",
    "https://www.youtube.com/watch?v="
  );
  if (!url) return;
  editor
    .chain()
    .focus()
    .setYoutubeVideo({ src: url, width: 640, height: 360 })
    .run();
}

interface ToolbarProps {
  editor: Editor;
}

function Toolbar({ editor }: ToolbarProps) {
  const clearFormatting = useCallback(() => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  return (
    <div
      role="toolbar"
      aria-label="본문 서식 도구"
      className="flex items-center gap-0.5 p-2 border-b bg-church-border-soft/50 flex-wrap rounded-t-md"
    >
      <Group label="제목">
        <ToolButton
          label="제목 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="제목 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="size-4" />
        </ToolButton>
      </Group>

      <Divider />

      <Group label="강조">
        <ToolButton
          label="굵게 (Ctrl/⌘+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          label="기울임 (Ctrl/⌘+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton
          label="밑줄 (Ctrl/⌘+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolButton>
        <ToolButton
          label="취소선"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolButton>
        <HighlightDropdown editor={editor} />
        <ColorDropdown editor={editor} />
        <ToolButton
          label="위 첨자"
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="size-4" />
        </ToolButton>
        <ToolButton
          label="아래 첨자"
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="size-4" />
        </ToolButton>
      </Group>

      <Divider />

      <Group label="목록">
        <ToolButton
          label="글머리 기호"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolButton>
        <ToolButton
          label="번호 매기기"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton
          label="체크리스트"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="size-4" />
        </ToolButton>
        <ToolButton
          label="인용문"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolButton>
        <ToolButton
          label="구분선"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </ToolButton>
      </Group>

      <Divider />

      <Group label="정렬">
        <ToolButton
          label="왼쪽 정렬"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="size-4" />
        </ToolButton>
        <ToolButton
          label="가운데 정렬"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="size-4" />
        </ToolButton>
        <ToolButton
          label="오른쪽 정렬"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="size-4" />
        </ToolButton>
      </Group>

      <Divider />

      <Group label="삽입">
        <ToolButton
          label="링크 추가/수정"
          active={editor.isActive("link")}
          onClick={() => insertLinkViaPrompt(editor)}
        >
          <LinkIcon className="size-4" />
        </ToolButton>
        <ToolButton
          label="링크 제거"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="size-4" />
        </ToolButton>
        <TableInsertPicker editor={editor} />
        <TableActionsDropdown editor={editor} />
        <ToolButton
          label="유튜브 삽입"
          onClick={() => insertYoutubeViaPrompt(editor)}
        >
          <YoutubeIcon className="size-4" />
        </ToolButton>
      </Group>

      <Divider />

      <Group label="기타">
        <ToolButton label="서식 모두 제거" onClick={clearFormatting}>
          <Eraser className="size-4" />
        </ToolButton>
        <ToolButton
          label="실행 취소 (Ctrl/⌘+Z)"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="다시 실행 (Ctrl/⌘+Shift+Z)"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolButton>
      </Group>
    </div>
  );
}

function useOutsideClose(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;
    function onDown(event: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(event.target as Node)) return;
      onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onClose, active]);
}

function TableInsertPicker({ editor }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ rows: number; cols: number }>({
    rows: 0,
    cols: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClose(containerRef, () => setOpen(false), open);

  const grid = useMemo(() => {
    const cells: { rows: number; cols: number }[] = [];
    for (let r = 1; r <= TABLE_PICKER_ROWS; r++) {
      for (let c = 1; c <= TABLE_PICKER_COLS; c++) {
        cells.push({ rows: r, cols: c });
      }
    }
    return cells;
  }, []);

  function commit(rows: number, cols: number) {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setOpen(false);
    setHover({ rows: 0, cols: 0 });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="표 삽입"
        title="표 삽입 — 원하는 칸 수를 선택하세요"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-church-text transition-colors",
          "hover:bg-church-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-navy/40"
        )}
      >
        <TableIcon className="size-4" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="표 크기 선택"
          className="absolute top-full left-0 mt-1 z-20 rounded-md border border-church-border bg-church-surface p-2 shadow-lg"
          onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
        >
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${TABLE_PICKER_COLS}, 18px)`,
            }}
          >
            {grid.map((cell) => {
              const highlighted =
                cell.rows <= hover.rows && cell.cols <= hover.cols;
              return (
                <button
                  key={`${cell.rows}-${cell.cols}`}
                  type="button"
                  aria-label={`${cell.rows} x ${cell.cols}`}
                  onMouseEnter={() =>
                    setHover({ rows: cell.rows, cols: cell.cols })
                  }
                  onClick={() => commit(cell.rows, cell.cols)}
                  className={cn(
                    "size-[18px] rounded-sm border border-church-border transition-colors",
                    highlighted
                      ? "bg-church-navy border-church-navy"
                      : "bg-church-border-soft hover:bg-church-border"
                  )}
                />
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-church-muted tabular-nums">
            {hover.rows > 0
              ? `${hover.rows} 행 × ${hover.cols} 열`
              : "크기를 선택하세요"}
          </p>
        </div>
      )}
    </div>
  );
}

function TableActionsDropdown({ editor }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inTable = editor.isActive("table");

  useOutsideClose(containerRef, () => setOpen(false), open);

  function run(command: () => boolean, keepOpen = false) {
    command();
    if (!keepOpen) setOpen(false);
  }

  type MenuItem =
    | { kind: "divider" }
    | {
        kind: "action";
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        destructive?: boolean;
      };

  const items: MenuItem[] = [
    {
      kind: "action",
      label: "행 위에 추가",
      icon: <ArrowUp className="size-4" />,
      onClick: () => run(() => editor.chain().focus().addRowBefore().run()),
    },
    {
      kind: "action",
      label: "행 아래에 추가",
      icon: <ArrowDown className="size-4" />,
      onClick: () => run(() => editor.chain().focus().addRowAfter().run()),
    },
    {
      kind: "action",
      label: "열 왼쪽에 추가",
      icon: <ArrowLeft className="size-4" />,
      onClick: () => run(() => editor.chain().focus().addColumnBefore().run()),
    },
    {
      kind: "action",
      label: "열 오른쪽에 추가",
      icon: <ArrowRight className="size-4" />,
      onClick: () => run(() => editor.chain().focus().addColumnAfter().run()),
    },
    { kind: "divider" },
    {
      kind: "action",
      label: "현재 행 삭제",
      icon: <Trash2 className="size-4" />,
      onClick: () => run(() => editor.chain().focus().deleteRow().run()),
    },
    {
      kind: "action",
      label: "현재 열 삭제",
      icon: <Trash2 className="size-4" />,
      onClick: () => run(() => editor.chain().focus().deleteColumn().run()),
    },
    { kind: "divider" },
    {
      kind: "action",
      label: "헤더 행 켜기/끄기",
      icon: <Plus className="size-4" />,
      onClick: () => run(() => editor.chain().focus().toggleHeaderRow().run()),
    },
    {
      kind: "action",
      label: "표 전체 삭제",
      icon: <Trash2 className="size-4 text-red-500" />,
      onClick: () => run(() => editor.chain().focus().deleteTable().run()),
      destructive: true,
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="표 편집"
        title={
          inTable
            ? "표 편집 — 행/열 추가·삭제"
            : "표 편집 (표 안에 커서를 두면 활성화됩니다)"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!inTable}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-church-text transition-colors",
          "hover:bg-church-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-navy/40",
          "disabled:opacity-40 disabled:pointer-events-none"
        )}
      >
        <TableProperties className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 z-30 min-w-[180px] rounded-md border border-church-border bg-church-surface p-1 shadow-lg"
        >
          {items.map((item, idx) => {
            if (item.kind === "divider") {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-1 h-px bg-church-border"
                />
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                // Prevent the editor from blurring on mousedown so the table
                // selection stays intact when the command fires.
                onMouseDown={(event) => event.preventDefault()}
                onClick={item.onClick}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                  "hover:bg-church-border-soft",
                  item.destructive && "text-red-600"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HighlightDropdown({ editor }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentColor =
    (editor.getAttributes("highlight")?.color as string | undefined) ?? "";
  const active = editor.isActive("highlight");

  useOutsideClose(containerRef, () => setOpen(false), open);

  function apply(value: string) {
    if (!value) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color: value }).run();
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="형광펜 색상"
        title="형광펜 — 색상을 선택하세요"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-pressed={active ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-church-text transition-colors",
          "hover:bg-church-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-navy/40",
          active && "bg-church-navy text-church-surface hover:bg-church-navy"
        )}
      >
        <Highlighter
          className="size-4"
          style={
            active && currentColor
              ? { color: currentColor as string }
              : undefined
          }
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 z-30 flex flex-wrap items-center gap-1 rounded-md border border-church-border bg-church-surface p-1.5 shadow-lg"
          style={{ maxWidth: "min(260px, calc(100vw - 2rem))" }}
        >
          {HIGHLIGHT_SWATCHES.map((swatch) => (
            <button
              key={swatch.label}
              type="button"
              role="menuitem"
              aria-label={swatch.label}
              title={swatch.label}
              onClick={() => apply(swatch.value)}
              className={cn(
                "size-7 rounded-md border border-church-border transition-transform hover:scale-110",
                !swatch.value &&
                  "flex items-center justify-center text-[11px] text-church-muted"
              )}
              style={swatch.value ? { background: swatch.value } : undefined}
            >
              {!swatch.value && <span aria-hidden>✕</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorDropdown({ editor }: ToolbarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentColor =
    (editor.getAttributes("textStyle")?.color as string | undefined) ?? "";

  useOutsideClose(containerRef, () => setOpen(false), open);

  function applyColor(value: string) {
    if (!value) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(value).run();
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="글자 색상"
        title="글자 색상"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-church-text transition-colors",
          "hover:bg-church-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-navy/40"
        )}
      >
        <Palette
          className="size-4"
          style={{ color: currentColor || undefined }}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 z-30 flex flex-wrap items-center gap-1 rounded-md border border-church-border bg-church-surface p-1.5 shadow-lg"
          style={{ maxWidth: "min(260px, calc(100vw - 2rem))" }}
        >
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.label}
              type="button"
              role="menuitem"
              aria-label={swatch.label}
              title={swatch.label}
              onClick={() => applyColor(swatch.value)}
              className={cn(
                "size-7 rounded-full border border-church-border transition-transform hover:scale-110",
                !swatch.value &&
                  "bg-church-surface text-[11px] flex items-center justify-center text-church-muted"
              )}
              style={
                swatch.value ? { backgroundColor: swatch.value } : undefined
              }
            >
              {!swatch.value && <span aria-hidden>✕</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Footer({ editor }: ToolbarProps) {
  const storage = editor.storage.characterCount as
    | { characters: () => number; words: () => number }
    | undefined;
  const chars = storage?.characters() ?? 0;
  const words = storage?.words() ?? 0;
  const near = chars >= CHARACTER_LIMIT * 0.9;
  const over = chars >= CHARACTER_LIMIT;

  return (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-1.5 text-[11px] text-church-muted rounded-b-md">
      <span>{words.toLocaleString("ko-KR")}단어</span>
      <span
        className={cn(
          "tabular-nums",
          over && "text-red-600 font-medium",
          !over && near && "text-amber-600"
        )}
      >
        {chars.toLocaleString("ko-KR")} /{" "}
        {CHARACTER_LIMIT.toLocaleString("ko-KR")}자
      </span>
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}

function ToolButton({
  label,
  onClick,
  active,
  disabled,
  compact,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active ? "true" : "false"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-church-text transition-colors",
        compact ? "size-7" : "size-8",
        "hover:bg-church-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-church-navy/40",
        "disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-church-navy text-church-surface hover:bg-church-navy"
      )}
    >
      {children}
    </button>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5">
      {children}
    </div>
  );
}

function Divider() {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      className="mx-1 h-5 w-px bg-church-border"
    />
  );
}
