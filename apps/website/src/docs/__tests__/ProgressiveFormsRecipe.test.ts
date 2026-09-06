// @vitest-environment happy-dom
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Effect } from "effect";
import ts from "typescript-compiler";
import { afterAll, expect, it, vi } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const root = resolve(import.meta.dirname, "../../..");
const directory = mkdtempSync(join(root, ".progressive-forms-check-"));
const examples = extractTypeScriptFenceDocuments(
  readFileSync(join(root, "content/recipes/progressive-forms.md"), "utf8"),
);
const files = examples.map(({ code, fileName }) => {
  if (!fileName) throw new Error("Expected named progressive-form example");
  const file = join(directory, fileName);
  writeFileSync(file, code);
  return file;
});
afterAll(() => rmSync(directory, { recursive: true, force: true }));

it("compiles the shared form, server, browser, and submission modules", () => {
  const program = ts.createProgram(files, {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  });
  expect(ts.getPreEmitDiagnostics(program).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  )).toEqual([]);
}, 60_000);

it("hydrates early input without replacing it and releases the hint handler", async () => {
  const { responseBody } = await import(join(directory, "server.ts"));
  const markup = await Effect.runPromise(responseBody as Effect.Effect<string>);
  const serverDocument = new DOMParser().parseFromString(markup, "text/html");
  document.body.append(document.importNode(serverDocument.querySelector("#app")!, true));
  const host = document.querySelector<HTMLElement>("#app")!;
  const input = host.querySelector<HTMLInputElement>("input")!;
  const form = host.querySelector<HTMLFormElement>("form")!;
  input.value = "early@example.com";
  input.focus();
  const { mountNewsletter } = await import(join(directory, "client.ts"));
  const stop: () => Promise<void> = mountNewsletter(host);
  try {
    // Wait for the runtime's event binding, preserving the pre-startup draft.
    await vi.waitFor(() => {
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      expect(host.querySelector("p")?.textContent).toBe("Email format looks valid.");
    });
    expect(host.querySelector("input")).toBe(input);
    expect(input.value).toBe("early@example.com");
    expect(document.activeElement).toBe(input);
    expect(form.getAttribute("action")).toBe("/newsletter");
    expect(form.method).toBe("post");
    input.value = "incomplete";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.querySelector("p")?.textContent).toBe("Enter a complete email address."));
    input.value = "ready@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await vi.waitFor(() => expect(host.querySelector("p")?.textContent).toBe("Email format looks valid."));
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(false);
    await stop();
    const hint = host.querySelector("p")?.textContent;
    input.value = "invalid";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await Effect.runPromise(Effect.yieldNow);
    expect(host.querySelector("p")?.textContent).toBe(hint);
  } finally {
    await stop();
    document.body.replaceChildren();
  }
}, 60_000);
