import test from "node:test";
import assert from "node:assert/strict";

import { fillPromptTemplate, joinPromptSections } from "./promptComposition.ts";

test("joins prompt sections without blank-section gaps", () => {
  assert.equal(
    joinPromptSections(["Base prompt", "", "  Extra instructions  "]),
    "Base prompt\n\nExtra instructions"
  );
});

test("fills named prompt template placeholders", () => {
  assert.equal(
    fillPromptTemplate("Original query: {{query}}\n{{hintLine}}", {
      query: "ISR dorms",
      hintLine: "Known UIUC hints: Illinois Street Residence Hall",
    }),
    "Original query: ISR dorms\nKnown UIUC hints: Illinois Street Residence Hall"
  );
});
