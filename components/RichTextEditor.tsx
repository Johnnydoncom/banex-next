"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href
    if (previousUrl) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt("URL")
    if (url === null) {
      return
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const buttons = [
    {
      icon: <Bold className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      title: "Bold",
    },
    {
      icon: <Italic className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      title: "Italic",
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
      title: "Strikethrough",
    },
    {
      icon: <LinkIcon className="h-4 w-4" />,
      onClick: toggleLink,
      isActive: editor.isActive("link"),
      title: "Link",
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      title: "Heading",
    },
    {
      icon: <List className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      title: "Bullet List",
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      title: "Numbered List",
    },
    {
      icon: <Quote className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      title: "Quote",
    },
    {
      icon: <Undo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().undo().run(),
      isActive: false,
      title: "Undo",
      disabled: !editor.can().undo(),
    },
    {
      icon: <Redo className="h-4 w-4" />,
      onClick: () => editor.chain().focus().redo().run(),
      isActive: false,
      title: "Redo",
      disabled: !editor.can().redo(),
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface p-2">
      {buttons.map((btn, idx) => (
        <Button variant="ghost"
          key={idx}
          type="button"
          onClick={btn.onClick}
          disabled={btn.disabled}
          title={btn.title}
          className={`rounded-md p-1.5 transition-colors hover:bg-muted ${
            btn.isActive ? "bg-muted text-brand" : "text-muted-foreground"
          } ${btn.disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {btn.icon}
        </Button>
      ))}
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand underline hover:text-brand-deep",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
        emptyEditorClass: "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-muted-foreground before:opacity-60 before:pointer-events-none",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
