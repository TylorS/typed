// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderFxMarble } from "../FxMarble.js";

const diagram = (source: string) => {
  const host = document.createElement("div");
  host.innerHTML = renderFxMarble(source)!;
  return host;
};

describe("marble coordinates", () => {
  it("uses zero-based ticks at one-based CSS columns on every lane", () => {
    const host = diagram(
      `input source: a . b |\noperator: switchMap(load)\ninner a: ^ a1 x . . .\ninner b: . . ^ b1 . |\noutput: . a1 . b1 . |`,
    );
    expect(host.querySelector(".fx-marble__diagram")?.getAttribute("data-ticks")).toBe("6");
    const first = host.querySelector<HTMLElement>('[data-tick="0"]');
    expect(first?.style.getPropertyValue("--fx-marble-slot")).toBe("1");
    expect([...host.querySelectorAll(".fx-marble__tick")].map((tick) => tick.textContent)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(host.querySelector(".fx-marble__row--input")?.getAttribute("aria-label")).toContain(
      "tick 0 a",
    );
    expect(host.querySelector(".fx-marble__event--cancelled")?.getAttribute("data-tick")).toBe("2");
    expect(host.querySelector('.fx-marble__row--output [data-tick="3"]')?.textContent).toBe("b1");
  });

  it("keeps long payloads and named control lanes intact", () => {
    const host = diagram(
      `input service context: a-rather-long-payload . |\noperator: map(service)\noutput: [a,b] !problem | . finalizer`,
    );
    expect(host.querySelector(".fx-marble__diagram")?.getAttribute("data-ticks")).toBe("5");
    expect(host.querySelector('.fx-marble__row--output [data-tick="0"]')?.textContent).toBe(
      "[a,b]",
    );
    expect(host.querySelector('.fx-marble__row--output [data-tick="4"]')?.textContent).toBe(
      "finalizer",
    );
    expect(host.querySelector(".fx-marble__event--error")?.getAttribute("data-description")).toBe(
      "Output: cause: problem",
    );
    expect(host.textContent).toContain("Service context");
  });

  it("includes a complete readable diagram and hides inert playback controls without JavaScript", () => {
    const host = diagram("input: value |\noperator: map(identity)\noutput: value |");
    expect(host.querySelector<HTMLElement>(".fx-marble__controls")?.hidden).toBe(true);
    expect(host.querySelectorAll(".fx-marble__event[hidden]")).toHaveLength(0);
    expect(host.textContent).toContain("Illustrated ticks");
    expect(host.textContent).toContain("cause");
    expect(host.querySelector('input[type="range"]')?.getAttribute("aria-label")).toBe(
      "Timeline position",
    );
  });
});
