/**
 * Showcase 18 — Parameterized editor component
 *
 * エディタ A/B で共有されるコンポーネント。
 * editor パラメータで色分けとラベルを切り替える。
 */

import { html } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { lines } from "./document";
import { conflictState } from "./conflicts";

const { div, span } = html;

export interface EditorProps {
  editor: "A" | "B";
}

export const Editor = (props: EditorProps) =>
  div(function* () {
    yield* div({ class: "editor-title" }, function* () {
      yield* span(
        { class: props.editor === "A" ? "badge-a" : "badge-b" },
        `Editor ${props.editor}`,
      );
    });

    // Conflict banner
    yield* reactive(() => {
      const conflict = conflictState();
      if (!conflict) return [];
      return [
        div(
          { class: "conflict-banner" },
          `Conflict on line ${conflict.lineIndex + 1}: ${conflict.editorA} vs ${conflict.editorB} — resolving...`,
        ),
      ];
    });

    // Lines
    yield* reactive(() => {
      const allLines = lines();
      return allLines.map((line, i) => {
        const conflict = conflictState();
        const isConflict = conflict?.lineIndex === i;
        const isEditing = line.lastEditor === props.editor;
        const isOtherEditing = line.lastEditor !== null && line.lastEditor !== props.editor;

        let lineClass = "editor-line";
        if (isConflict) lineClass += " conflict";
        else if (isEditing) lineClass += ` editing-${props.editor.toLowerCase()}`;
        else if (isOtherEditing) lineClass += ` editing-${line.lastEditor!.toLowerCase()}`;

        return div({ class: lineClass }, function* () {
          yield* span({ class: "line-num" }, String(i + 1));
          yield* span({ class: "line-content" }, line.content || "\u00a0");
          yield* span({ class: "line-editor" }, line.lastEditor ?? "");
        });
      });
    });
  });
