import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript-compiler";
import { describe, expect, it } from "vitest";
import { parseGuideDocumentation } from "../Frontmatter.js";
import { extractTypeScriptFences } from "../Recipes.js";

const websiteRoot = fileURLToPath(new URL("../../../", import.meta.url));
const guideFile = "template-namespaces-and-platform-markup.md";

const readGuide = () =>
  parseGuideDocumentation(
    guideFile,
    fs.readFileSync(path.join(websiteRoot, "content/guides", guideFile), "utf8"),
  );

describe("Template namespaces guide", () => {
  it("documents the tested HTML, SVG, and MathML boundaries without extending them", () => {
    const guide = readGuide();

    expect(guide).toMatchObject({
      slug: "template-namespaces-and-platform-markup",
      section: "Template bindings",
      kind: "deep-dive",
    });
    for (const detail of ["foreignObject", "xlink:href", "definitionURL", "annotation-xml", "namespaceURI", "localName"]) {
      expect(guide.body).toContain(detail);
    }
    const examples = extractTypeScriptFences(guide.body).join("\n");
    expect(examples).toContain('<nav>${link("Details")}</nav>');
    expect(examples).toContain('${link(html`<text x="20" y="40">Details</text>`)}');
    expect(extractTypeScriptFences(guide.body)).not.toHaveLength(0);
  });

  it("keeps each platform-markup example independently compilable", () => {
    const staging = fs.mkdtempSync(path.join(websiteRoot, ".template-namespaces-guide-check-"));

    try {
      const examples = extractTypeScriptFences(readGuide().body).map((code, index) => {
        const file = path.join(staging, `example-${index}.ts`);
        fs.writeFileSync(file, code);
        return file;
      });
      const program = ts.createProgram(examples, {
        esModuleInterop: true,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });

      expect(
        ts.formatDiagnosticsWithColorAndContext(ts.getPreEmitDiagnostics(program), {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => websiteRoot,
          getNewLine: () => "\n",
        }),
      ).toBe("");
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  });
});
