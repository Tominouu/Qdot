import { EditorWorkspace } from "@/components/workspace/editor-workspace";

/** The editor creates and edits codes in the selected workspace (signed-out onboarding works without one). */
export default function EditorLayout({ children }: LayoutProps<"/">) {
  return <EditorWorkspace>{children}</EditorWorkspace>;
}
