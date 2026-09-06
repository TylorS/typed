import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { uiAccessibilityFamilies } from "../UiAccessibility.js";

const workspaceRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

const publicComponentFamilies = [
  "Alert",
  "Button",
  "Carousel",
  "Checkbox",
  "Combobox",
  "Dialog",
  "Disclosure",
  "Focusable",
  "Form",
  "Grid",
  "Group",
  "Heading",
  "Hovercard",
  "Link",
  "Listbox",
  "Menu",
  "Menubar",
  "Meter",
  "NativeDetails",
  "NativeDialog",
  "NativePopover",
  "Popover",
  "RadioGroup",
  "Role",
  "Select",
  "Separator",
  "Slider",
  "SpinButton",
  "Switch",
  "Tab",
  "Tabs",
  "Toolbar",
  "Tooltip",
  "Tree",
  "TreeGrid",
  "VisuallyHidden",
  "WindowSplitter",
] as const;

describe("@typed/ui accessibility registry", () => {
  it("covers every public component family with evidence, standards, and author responsibility", () => {
    expect(uiAccessibilityFamilies.flatMap((entry) => entry.families).sort()).toEqual(
      [...publicComponentFamilies].sort(),
    );

    for (const entry of uiAccessibilityFamilies) {
      expect(entry.typedVerifies.length, entry.id).toBeGreaterThan(0);
      expect(entry.authorsMustProvide.length, entry.id).toBeGreaterThan(0);
      expect(
        entry.evidence.some(({ file }) => file.startsWith("packages/ui/src/")),
        entry.id,
      ).toBe(true);
      for (const evidence of entry.evidence) {
        expect(
          fs.existsSync(new URL(evidence.file, `file://${workspaceRoot}/`)),
          evidence.file,
        ).toBe(true);
      }
      expect(entry.references.length, entry.id).toBeGreaterThan(0);
      for (const reference of entry.references) {
        expect(reference.href).toMatch(
          /^https:\/\/(?:www\.w3\.org|developer\.mozilla\.org|html\.spec\.whatwg\.org)\//u,
        );
      }
    }
  });
});
