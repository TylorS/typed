import { readFileSync, readdirSync } from "node:fs";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../../docs/Frontmatter.js";
import { parseCurriculumFiles } from "../../tutorial/Files.js";
import { renderMarkdown } from "../Markdown.js";

describe("TodoMVC lesson rendering", () => {
  it("keeps teaching excerpts visible and complete executable snapshots collapsed", async () => {
    for (const name of readdirSync("content/tutorial").filter((name) => name.endsWith(".md"))) {
      const { body } = parseFrontmatter(name, readFileSync(`content/tutorial/${name}`, "utf8"));
      const { files } = parseCurriculumFiles(name, body);
      const { code } = await renderMarkdown(body);
      const window = new Window();
      try {
        const document = window.document;
        document.body.innerHTML = code;
        expect(document.querySelector("pre")?.closest("details"), name).toBeNull();
        expect(document.querySelector("pre")?.textContent, name).toBeTruthy();
        expect(document.body.textContent, name).not.toContain("@source");
        expect(document.body.textContent, name).not.toContain("@expect");
        const snapshots = [...document.querySelectorAll("details")];
        expect(snapshots.length, name).toBe(files.length);
        for (const file of files) {
          const snapshot = snapshots.find(
            (element) => element.querySelector("summary")?.textContent === file.name,
          );
          expect(snapshot?.hasAttribute("open"), `${name}: ${file.name}`).toBe(false);
          expect(
            snapshot?.querySelector("pre > code")?.textContent?.trim(),
            `${name}: ${file.name}`,
          ).toBe(file.source);
        }
      } finally {
        await window.happyDOM.close();
      }
    }
  });
});
