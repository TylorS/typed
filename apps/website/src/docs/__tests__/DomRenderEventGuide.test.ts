// @vitest-environment happy-dom
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Deferred, Effect, Fiber, type Scope } from "effect";
import { TestClock } from "effect/testing";
import { expect, it } from "@effect/vitest";
import { Fx } from "@typed/fx";
import type { DomRenderEvent } from "@typed/template/RenderEvent";
import { afterAll, vi } from "vitest";
import { extractTypeScriptFenceDocuments } from "../RecipeValidation.js";

const website = resolve(import.meta.dirname, "../../..");
const directory = mkdtempSync(join(website, ".canvas-guide-check-"));
afterAll(() => rmSync(directory, { recursive: true, force: true }));

const source = readFileSync(join(website, "content/guides/dom-render-event.md"), "utf8");
const example = extractTypeScriptFenceDocuments(source).find(({ fileName }) => fileName === "ClockCanvas.ts");
if (!example) throw new Error("Missing ClockCanvas guide example");

writeFileSync(join(directory, "ClockCanvas.ts"), example.code);
const { ClockCanvas }: {
  ClockCanvas: (document: Document) => Fx.Fx<DomRenderEvent, never, Scope.Scope>;
} = await import(join(directory, "ClockCanvas.ts"));

it.effect("keeps the guide canvas painting after its first output and stops on interruption", () =>
  Effect.gen(function* () {
    const paint = vi.fn();
    const canvas = document.createElement("canvas");
    const context = { clearRect: vi.fn(), fillText: paint } as unknown as CanvasRenderingContext2D;
    const canvasContext = vi.spyOn(canvas, "getContext").mockReturnValue(context);
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(canvas);

    try {
      const ready = yield* Deferred.make<void>();
      const outputs: DomRenderEvent[] = [];
      const fiber = yield* ClockCanvas(document).pipe(
        Fx.observe((event) => Effect.sync(() => outputs.push(event)).pipe(
          Effect.andThen(Deferred.succeed(ready, undefined)),
        )),
        Effect.forkScoped,
      );
      yield* Deferred.await(ready);

      expect(outputs).toHaveLength(1);
      expect(outputs[0]!.valueOf()).toBe(canvas);
      expect(paint).toHaveBeenCalledTimes(1);

      yield* TestClock.adjust("1 second");

      expect(paint).toHaveBeenCalledTimes(2);
      expect(outputs).toHaveLength(1);

      yield* Fiber.interrupt(fiber);
      yield* TestClock.adjust("2 seconds");

      expect(paint).toHaveBeenCalledTimes(2);
    } finally {
      createElement.mockRestore();
      canvasContext.mockRestore();
    }
  }),
);
