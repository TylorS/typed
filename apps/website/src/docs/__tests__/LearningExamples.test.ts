// @vitest-environment happy-dom
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Effect, Fiber, type Scope } from "effect";
import { Fx, type RefSubject } from "@typed/fx";
import {
  DomRenderTemplate,
  html,
  render,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import { afterAll, expect, it, vi } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const website = resolve(import.meta.dirname, "../../..");
const directory = mkdtempSync(join(website, ".learning-examples-"));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

// Execute the tests readers copy, importing the modules printed alongside them.
for (const slug of [
  "application-developers",
  "building-ui-components",
  "async-data-requests-and-cache",
  "refsubject-renderer-independent-state",
  "versioned-state",
]) {
  const body = readFileSync(join(website, "content/guides", `${slug}.md`), "utf8");
  const files = extractTypeScriptFenceDocuments(body).filter(({ fileName }) => fileName);
  for (const { fileName, code } of files) {
    const file = join(directory, slug, fileName!);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, code);
  }
  for (const { fileName } of files) {
    if (fileName!.endsWith(".test.ts")) await import(join(directory, slug, fileName!));
  }
}

it("keeps the published order editor and summary in sync through native buttons", async () => {
  interface LineItem {
    readonly quantity: RefSubject.Computed<number>;
    readonly subtotal: RefSubject.Computed<number>;
    readonly add: Effect.Effect<number>;
    readonly remove: Effect.Effect<number>;
  }
  const {
    makeLineItem,
  }: {
    makeLineItem: () => Effect.Effect<LineItem, never, Scope.Scope>;
  } = await import(join(directory, "application-developers/LineItem.ts"));
  type View = (item: LineItem) => Fx.Fx<RenderEvent, never, Scope.Scope | RenderTemplate>;
  const { QuantityEditor, OrderSummary }: { QuantityEditor: View; OrderSummary: View } =
    await import(join(directory, "application-developers/View.ts"));
  const host = document.createElement("div");
  document.body.append(host);
  const order = Fx.gen(function* () {
    const item = yield* makeLineItem();
    return html`${QuantityEditor(item)}${OrderSummary(item)}`;
  });
  const fiber = Effect.runFork(
    render(order, host).pipe(
      Fx.drain,
      Effect.provide(DomRenderTemplate.using(document)),
      Effect.scoped,
    ),
  );
  try {
    await vi.waitFor(() => expect(host.querySelectorAll("button")).toHaveLength(2));
    const [remove, add] = [...host.querySelectorAll("button")];
    expect(remove!.disabled).toBe(true);
    expect(host.querySelector("output")?.textContent).toBe("Quantity: 1");
    expect(host.querySelector("aside")?.textContent).toContain("$12.00");
    add!.click();
    await vi.waitFor(() => {
      expect(host.querySelector("output")?.textContent).toBe("Quantity: 2");
      expect(host.querySelector("aside")?.textContent).toContain("$24.00");
      expect(remove!.disabled).toBe(false);
    });
    remove!.click();
    await vi.waitFor(() => {
      expect(host.querySelector("output")?.textContent).toBe("Quantity: 1");
      expect(remove!.disabled).toBe(true);
    });
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber));
    host.remove();
  }
});
