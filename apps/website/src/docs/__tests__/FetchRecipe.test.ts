// @vitest-environment happy-dom
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Effect, Fiber, Layer, type Scope } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render, type RenderEvent, type RenderTemplate } from "@typed/template";
import { expect, it, vi } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

it("renders the fetch recipe before its shared request resolves", async () => {
  const root = resolve(import.meta.dirname, "../../..");
  const directory = mkdtempSync(join(root, ".fetch-recipe-check-"));
  const host = document.createElement("div");
  document.body.append(host);
  let respond!: (response: Response) => void;
  const response = new Promise<Response>((resolve) => {
    respond = resolve;
  });
  const fetch = vi.fn(() => response);
  vi.stubGlobal("fetch", fetch);
  let fiber: Fiber.Fiber<unknown, unknown> | undefined;
  try {
    const source = readFileSync(join(root, "content/recipes/fetch-schema.md"), "utf8");
    for (const { code, fileName } of extractTypeScriptFenceDocuments(source)) {
      if (!fileName) throw new Error("Expected a named fetch example");
      writeFileSync(join(directory, fileName), code);
    }
    const { profile }: { profile: Fx.Fx<RenderEvent, unknown, RenderTemplate | Scope.Scope> } =
      await import(join(directory, "Browser.ts"));
    fiber = Effect.runFork(
      render(profile, host).pipe(
        Fx.drainLayer,
        Layer.provide(DomRenderTemplate.using(document)),
        Layer.launch,
      ),
    );
    await vi.waitFor(() => {
      expect(host.querySelector("article")).not.toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    const article = host.querySelector("article");
    expect(host.querySelector("h2")?.textContent).toBe("Loading profile…");
    respond(
      new Response(JSON.stringify({ id: "ada", displayName: "Ada Lovelace" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    await vi.waitFor(() => expect(host.querySelector("h2")?.textContent).toBe("Ada Lovelace"));
    expect(host.querySelector("article")).toBe(article);
    expect(host.textContent).toContain("Account ada");
    expect(fetch).toHaveBeenCalledTimes(1);
  } finally {
    if (fiber) await Effect.runPromise(Fiber.interrupt(fiber));
    vi.unstubAllGlobals();
    host.remove();
    rmSync(directory, { recursive: true, force: true });
  }
});
