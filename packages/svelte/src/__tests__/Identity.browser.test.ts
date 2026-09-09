import * as Layer from "effect/Layer";
import { RandomValues } from "@typed/id/RandomValues";
import { describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { tick } from "svelte";
import Stateful from "./fixtures/Stateful.svelte";
import { siblings } from "./fixtures/trees.js";
import { view } from "../view.js";

describe("Svelte host identity in the browser", () => {
  it("mounts reused views without options and preserves an explicit host override", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    try {
      await Effect.gen(function* () {
        const shared = view(Stateful, { label: "automatic" });
        yield* render(siblings(shared, shared), target).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() =>
          expect.poll(() => target.querySelectorAll("[data-stateful]").length).toBe(2),
        );
        const hosts = [...target.querySelectorAll<HTMLButtonElement>("[data-stateful]")].map(
          (button) => button.parentElement!,
        );
        expect(hosts[0].id.length).toBeGreaterThan(0);
        expect(hosts[1].id).not.toBe(hosts[0].id);
        const explicitTarget = document.createElement("div");
        target.append(explicitTarget);
        yield* render(
          view(Stateful, { label: "explicit" }, { id: "explicit-host" }),
          explicitTarget,
        ).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() =>
          expect
            .poll(() => explicitTarget.querySelector("#explicit-host [data-stateful]"))
            .not.toBeNull(),
        );
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      target.remove();
    }
  });

  it("restores server identities and exact nodes when a fresh shared view hydrates siblings", async () => {
    const target = document.createElement("div");
    target.innerHTML = (await commands.renderSvelteFixture("auto-identity", "server")).html;
    document.body.append(target);
    const buttons = [...target.querySelectorAll<HTMLButtonElement>("[data-stateful]")];
    const hosts = buttons.map((button) => button.parentElement!);
    const hostIds = hosts.map((host) => host.id);
    const buttonIds = buttons.map((button) => button.id);
    expect(new Set(hostIds).size).toBe(2);
    expect(new Set(buttonIds).size).toBe(2);
    const warnings = vi.spyOn(console, "warn");
    const errors = vi.spyOn(console, "error");
    try {
      await Effect.gen(function* () {
        let mounted = 0;
        const onMounted = () => {
          mounted++;
        };
        const props = yield* RefSubject.make({ label: "server", onMounted });
        const shared = view(Stateful, props);
        yield* render(siblings(shared, shared), target).pipe(Fx.drain, Effect.forkScoped);
        yield* Effect.promise(() => expect.poll(() => mounted).toBe(2));
        const hydrated = [...target.querySelectorAll<HTMLButtonElement>("[data-stateful]")];
        expect(hydrated[0]).toBe(buttons[0]);
        expect(hydrated[1]).toBe(buttons[1]);
        expect(hydrated.map((button) => button.id)).toEqual(buttonIds);
        expect(hydrated.map((button) => button.parentElement!.id)).toEqual(hostIds);
        expect(hydrated[0].parentElement).toBe(hosts[0]);
        expect(hydrated[1].parentElement).toBe(hosts[1]);
        buttons[0].click();
        buttons[1].click();
        buttons[1].click();
        yield* Effect.promise(tick);
        yield* RefSubject.set(props, { label: "client", onMounted });
        yield* Effect.promise(() =>
          expect
            .poll(() => buttons.map((button) => button.textContent))
            .toEqual(["client:1", "client:2"]),
        );
        expect(mounted).toBe(2);
        expect(warnings.mock.calls.flat().join("\n")).not.toContain("hydration");
        expect(errors.mock.calls.flat().join("\n")).not.toContain("hydration");
      }).pipe(
        Effect.provide(Layer.merge(DomRenderTemplate.using(document), RandomValues.Default)),
        Effect.scoped,
        Effect.runPromise,
      );
    } finally {
      warnings.mockRestore();
      errors.mockRestore();
      target.remove();
    }
  });
});
