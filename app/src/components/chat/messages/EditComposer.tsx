/**
 * @file ./src/components/chat/messages/EditComposer.tsx
 * @description Chat (AI) Component / Module
 *
 * Rendered by ThreadPrimitive.Messages in place of a user message while it is
 * being edited (triggered by ActionBarPrimitive.Edit). Saving calls the
 * runtime's onEdit handler, which re-streams the reply.
 */

import { ComposerPrimitive } from "@assistant-ui/react";
import { ImeSafeComposerTextarea } from "../adapters/ImeSafeComposerTextarea";

interface EditComposerProps {
  saveLabel: string;
  cancelLabel: string;
}

export const EditComposer: React.FC<EditComposerProps> = ({
  saveLabel,
  cancelLabel,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-row-reverse px-4 py-6">
      <ComposerPrimitive.Root
        className="
          flex w-full flex-col rounded-2xl border border-slate-200 bg-slate-50
          shadow-sm
        "
      >
        <ComposerPrimitive.Input
          className="
            w-full resize-none bg-transparent p-3 text-base text-slate-900
            focus:outline-none
          "
          render={<ImeSafeComposerTextarea />}
          rows={1}
          autoFocus
        />
        <div className="flex justify-end gap-2 p-2">
          <ComposerPrimitive.Cancel
            className="
              rounded-lg px-3 py-1.5 text-sm text-slate-600 transition-colors
              hover:bg-slate-200
            "
          >
            {cancelLabel}
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send
            className="
              rounded-lg bg-black px-3 py-1.5 text-sm text-white transition-all
              hover:opacity-80
              disabled:cursor-not-allowed disabled:bg-slate-300
            "
          >
            {saveLabel}
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
};
