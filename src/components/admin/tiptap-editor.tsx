"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none focus:outline-none",
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

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL을 입력하세요", previousUrl);

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

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex gap-1 p-2 border-b bg-church-border-soft/50 flex-wrap">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          굵게
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          기울임
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          목록
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          번호목록
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={setLink}
        >
          링크
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
