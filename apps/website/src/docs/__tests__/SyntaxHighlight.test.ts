// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../site/Markdown.js";

const renderDiagram = async (source: string) => {
  const rendered = await renderMarkdown(`\`\`\`fx-marble\n${source}\n\`\`\``);
  const host = document.createElement("div");
  host.innerHTML = rendered.code;
  return host;
};

describe("Astro Markdown Fx diagrams", () => {
  it("renders fx-marble fences as labelled timelines with optional playback", async () => {
    const host = await renderDiagram(`title: filter keeps even values
input: 1 . 2 . 3 . 4 |
operator: filter(isEven)
output: . . 2 . . . 4 |`);

    expect(host.querySelector("figure")?.getAttribute("aria-label")).toBe(
      "filter keeps even values",
    );
    expect(
      host
        .querySelector('.fx-marble__row--input[role="img"]')
        ?.getAttribute("aria-label"),
    ).toBe(
      "Input timeline: tick 0 1, tick 2 2, tick 4 3, tick 6 4, tick 7 complete",
    );
    expect(host.querySelector(".fx-marble__operator")?.textContent).toBe(
      "filter(isEven)",
    );
    expect(host.querySelector(".fx-marble__event--value")).not.toBeNull();
    expect(host.querySelector(".fx-marble__event--complete")).not.toBeNull();
    expect(
      host.querySelector<HTMLElement>(".fx-marble__controls")?.hidden,
    ).toBe(true);
  });

  it("uses explicit shapes and accessible names for fx-marble errors and cancellation", async () => {
    const host = await renderDiagram(`input: request !timeout x
operator: retry
output: request !timeout x`);

    expect(
      host.querySelector(".fx-marble__row--input")?.getAttribute("aria-label"),
    ).toBe(
      "Input timeline: tick 0 request, tick 1 cause: timeout, tick 2 cancelled",
    );
    expect(
      host.querySelector('.fx-marble__row .fx-marble__event--error svg path')
        ?.getAttribute("d"),
    ).toBe("M12 5V13M12 18V19");
    expect(
      host.querySelector('.fx-marble__row .fx-marble__event--cancelled svg path')
        ?.getAttribute("d"),
    ).toBe("M6 6L18 18M18 6L6 18");
  });

  it("uses one shared clock for named fx-marble timelines", async () => {
    const host =
      await renderDiagram(`title: sample reads the latest value on every tick
input values: a . source-b . |
input sampler: . tick . tick |
operator: sample(values)
output: . a . sampled-b |`);

    expect(
      host
        .querySelector<HTMLElement>(".fx-marble__diagram")
        ?.style.getPropertyValue("--fx-marble-steps"),
    ).toBe("5");
    const rows = host.querySelectorAll(".fx-marble__row--input");
    expect(rows[0]?.querySelector(".fx-marble__label")?.textContent).toBe(
      "Values",
    );
    expect(rows[1]?.querySelector(".fx-marble__label")?.textContent).toBe(
      "Sampler",
    );
    expect(rows[0]?.getAttribute("aria-label")).toBe(
      "Values timeline: tick 0 a, tick 2 source-b, tick 4 complete",
    );
    const event = rows[0]?.querySelector<HTMLElement>('[data-tick="2"]');
    expect(event?.textContent).toBe("source-b");
    expect(event?.style.getPropertyValue("--fx-marble-slot")).toBe("3");
    expect(
      host.querySelector('.fx-marble__track[style*="--fx-marble-steps"]'),
    ).toBeNull();
  });

  it("renders inner Fx lifetimes on the same clock as their outer source", async () => {
    const host =
      await renderDiagram(`title: switchMap ends the old inner before starting its replacement
input outer: a . b . . . |
operator: switchMap(preview)
inner a: ^ a1 x . . . .
inner b: . . ^ b1 . b2 |
output: . a1 . b1 . b2 |`);

    const rows = host.querySelectorAll(".fx-marble__row--inner");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelector(".fx-marble__label")?.textContent).toBe("A");
    expect(rows[0]?.getAttribute("aria-label")).toBe(
      "A timeline: tick 0 start, tick 1 a1, tick 2 cancelled",
    );
    expect(
      rows[0]?.querySelector(".fx-marble__event--start svg path")?.getAttribute("d"),
    ).toBe("M5 15L12 8L19 15");
    expect(
      host.querySelector(".fx-marble__legend .fx-marble__event--start svg path")?.getAttribute("d"),
    ).toBe(rows[0]?.querySelector(".fx-marble__event--start svg path")?.getAttribute("d"));
    const cancelled = rows[0]?.querySelector<HTMLElement>(
      ".fx-marble__event--cancelled",
    );
    expect(cancelled?.dataset.tick).toBe("2");
    expect(cancelled?.style.getPropertyValue("--fx-marble-slot")).toBe("3");
    expect(rows[1]?.getAttribute("aria-label")).toBe(
      "B timeline: tick 2 start, tick 3 b1, tick 5 b2, tick 6 complete",
    );
  });

  it("shows every public operator represented by a shared semantic diagram", async () => {
    const host =
      await renderDiagram(`title: filter keeps values which satisfy a predicate
covers: filter, filterEffect
input: 1 . 2 . 3 . 4 |
operator: filter / filterEffect
output: . . 2 . . . 4 |`);

    expect(host.querySelector<HTMLElement>("figure")?.dataset.fxOperators).toBe(
      "filter filterEffect",
    );
    const coverage = host.querySelector(".fx-marble__coverage");
    expect(coverage?.getAttribute("aria-label")).toBe(
      "Operators represented: filter, filterEffect",
    );
    expect(
      [...coverage!.querySelectorAll("code")].map((code) => code.textContent),
    ).toEqual(["filter", "filterEffect"]);
  });

  it("rejects malformed Fx diagrams before publication", async () => {
    await expect(
      renderMarkdown("```fx-marble\nnot a diagram\n```"),
    ).rejects.toThrow("Invalid Fx marble diagram");
  });
});
