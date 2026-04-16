"use client";

import { useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHARACTER_LIMIT = 10000;

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
      Highlight.configure({ multicolor: false }),
      CharacterCount.configure({ limit: CHARACTER_LIMIT }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
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

  // Sync external content changes (e.g. draft restore from localStorage) into
  // the editor. Tiptap's `useEditor({ content })` only reads `content` at
  // initialization, so a later prop change has no effect without this effect.
  // Guard with HTML equality to avoid feedback loops from user typing.
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
    <div className="border rounded-md overflow-hidden bg-church-surface">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <Footer editor={editor} />
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
}

function Toolbar({ editor }: ToolbarProps) {
  const handleLink = useCallback(() => {
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
  }, [editor]);

  const clearFormatting = useCallback(() => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  }, [editor]);

  return (
    <div
      role="toolbar"
      aria-label="본문 서식 도구"
      className="flex items-center gap-0.5 p-2 border-b bg-church-border-soft/50 flex-wrap"
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
        <ToolButton
          label="형광펜"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="size-4" />
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

      <Group label="링크">
        <ToolButton
          label="링크 추가/수정"
          active={editor.isActive("link")}
          onClick={handleLink}
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

function Footer({ editor }: ToolbarProps) {
  const storage = editor.storage.characterCount as
    | { characters: () => number; words: () => number }
    | undefined;
  const chars = storage?.characters() ?? 0;
  const words = storage?.words() ?? 0;
  const near = chars >= CHARACTER_LIMIT * 0.9;
  const over = chars >= CHARACTER_LIMIT;

  return (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-1.5 text-[11px] text-church-muted">
      <span>{words.toLocaleString("ko-KR")}단어</span>
      <span
        className={cn(
          "tabular-nums",
          over && "text-red-600 font-medium",
          !over && near && "text-amber-600"
        )}
      >
        {chars.toLocaleString("ko-KR")} / {CHARACTER_LIMIT.toLocaleString("ko-KR")}자
      </span>
    </div>
  );
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolButton({
  label,
  onClick,
  active,
  disabled,
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
        "inline-flex size-8 items-center justify-center rounded-md text-church-text transition-colors",
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
