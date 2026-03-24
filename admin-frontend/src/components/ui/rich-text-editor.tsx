"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback } from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  ImageIcon,
  Table2,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  Columns2,
  Code2,
  RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:opacity-40 disabled:pointer-events-none",
        active
          ? "bg-primary/20 text-primary border border-primary/30"
          : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-border mx-1 shrink-0" />;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Viết nội dung bài viết tại đây...",
  className,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[400px] px-6 py-5 prose prose-sm dark:prose-invert max-w-none focus:outline-none",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  const insertTwoColumnTable = useCallback(() => {
    editor?.chain().focus()
      .insertTable({ rows: 3, cols: 2, withHeaderRow: false })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-card", className)}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/40 p-2 flex flex-wrap gap-0.5 items-center">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline Code"
        >
          <Code size={15} />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          <AlignJustify size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code2 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <ToolbarButton
          onClick={() => setShowLinkInput((v) => !v)}
          active={editor.isActive("link") || showLinkInput}
          title="Insert Link"
        >
          <Link2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageInput((v) => !v)}
          active={showImageInput}
          title="Insert Image"
        >
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          active={editor.isActive("table")}
          title="Insert Table"
        >
          <Table2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={insertTwoColumnTable}
          title="2-Column Layout"
        >
          <Columns2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting size={15} />
        </ToolbarButton>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="border-b border-border bg-muted/20 px-3 py-2 flex gap-2 items-center">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setLink()}
            placeholder="https://..."
            className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded outline-none focus:border-primary"
            autoFocus
          />
          <Button size="sm" onClick={setLink} className="h-8 text-xs">Chèn link</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)} className="h-8 text-xs">Huỷ</Button>
        </div>
      )}

      {/* Image Input */}
      {showImageInput && (
        <div className="border-b border-border bg-muted/20 px-3 py-2 flex gap-2 items-center">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && insertImage()}
            placeholder="URL ảnh: https://..."
            className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded outline-none focus:border-primary"
            autoFocus
          />
          <Button size="sm" onClick={insertImage} className="h-8 text-xs">Chèn ảnh</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowImageInput(false)} className="h-8 text-xs">Huỷ</Button>
        </div>
      )}

      {/* Table toolbar when inside table */}
      {editor.isActive("table") && (
        <div className="border-b border-border bg-muted/20 px-3 py-1.5 flex gap-1 items-center text-xs text-muted-foreground">
          <span className="mr-1 font-medium">Bảng:</span>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">+ Cột trước</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">+ Cột sau</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">- Cột</button>
          <span className="mx-1">|</span>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">+ Dòng trước</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">+ Dòng sau</button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }} className="px-2 py-0.5 rounded hover:bg-accent text-xs">- Dòng</button>
          <span className="mx-1">|</span>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} className="px-2 py-0.5 rounded hover:bg-destructive/20 text-destructive text-xs">Xoá bảng</button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word count */}
      <div className="border-t border-border px-4 py-1.5 flex justify-between items-center text-xs text-muted-foreground bg-muted/20">
        <span>{editor.storage.characterCount?.characters?.() ?? 0} ký tự</span>
        <span>{editor.getText().trim().split(/\s+/).filter(Boolean).length} từ</span>
      </div>
    </div>
  );
}
