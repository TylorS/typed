// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, Exit, Fiber, Scope } from "effect";
import { renderFxMarble } from "../../docs/FxMarble.js";
import { enhanceMarbles } from "../components/MarblePlayback.js";
import { page } from "../Page.js";

const pendingFrames = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;
let now = 0;
const disposers: Array<() => Promise<void>> = [];
const settle = () => Effect.runPromise(Effect.yieldNow);
const advance = async (milliseconds: number) => {
  now += milliseconds;
  const next = [...pendingFrames.values()];
  pendingFrames.clear();
  next.forEach((frame) => frame(now));
  await settle();
};
const defaultSource =
  "input: a . b | . .\noperator: switchMap(load)\ninner old: ^ a1 x . . .\ninner new: . . ^ b1 . |\noutput: . a1 . b1 . |";
const mountGroup = async (...sources: string[]) => {
  const host = document.createElement("div");
  host.innerHTML = sources.map((source) => renderFxMarble(source)).join("");
  document.body.append(host);
  const before = [...host.querySelectorAll<HTMLElement>("figure")];
  const scope = Effect.runSync(Scope.make());
  disposers.push(() => Effect.runPromise(Scope.close(scope, Exit.void)));
  await Effect.runPromise(Scope.provide(enhanceMarbles(host), scope));
  await vi.waitFor(() =>
    expect(host.querySelectorAll('[data-enhanced="true"]')).toHaveLength(
      sources.length,
    ),
  );
  return [...host.querySelectorAll<HTMLElement>("figure")].map(
    (figure, index) => {
      expect(figure).toBe(before[index]); // Hydrate the authored static nodes in place.
      const click = async (action: string) => {
        figure
          .querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!
          .click();
        await settle();
      };
      const seek = async (tick: number) => {
        const input = figure.querySelector<HTMLInputElement>(
          'input[type="range"]',
        )!;
        input.value = String(tick);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
      };
      return { figure, click, seek };
    },
  );
};
const mount = async (source = defaultSource) => (await mountGroup(source))[0]!;

beforeEach(() => {
  now = 0;
  pendingFrames.clear();
  nextFrameId = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = ++nextFrameId;
    pendingFrames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    pendingFrames.delete(id);
  });
});
afterEach(async () => {
  for (const dispose of disposers.splice(0)) await dispose();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("marble playback", () => {
  it("hydrates lane and event class suffixes without introducing component classes", async () => {
    const { figure } = await mount();
    expect(figure.querySelector(".fx-marble__row--input")?.className).toBe(
      "fx-marble__row fx-marble__row--input",
    );
    expect(figure.querySelector(".fx-marble__event--value")?.className).toBe(
      "fx-marble__event fx-marble__event--value",
    );
    expect(figure.querySelector(".input, .inner, .output, .value, .complete")).toBeNull();
  });

  it("reveals tick zero immediately and reaches later events with no extra leading tick", async () => {
    const { figure, click } = await mount();
    expect(
      figure
        .querySelector('.fx-marble__row--input [data-tick="0"]')
        ?.getAttribute("data-phase"),
    ).toBe("current");
    expect(
      figure
        .querySelector('.fx-marble__row--input [data-tick="2"]')
        ?.getAttribute("data-phase"),
    ).toBe("future");
    expect(figure.querySelector("select")?.value).toBe("1");
    await click("play");
    await advance(500); // Default 1x: one illustrated tick per second.
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("0.5");
    expect(
      figure
        .querySelector('.fx-marble__row--output [data-tick="1"]')
        ?.getAttribute("data-phase"),
    ).toBe("future");
    await advance(500);
    expect(
      figure
        .querySelector('.fx-marble__row--output [data-tick="1"]')
        ?.getAttribute("data-phase"),
    ).toBe("current");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 1 / 5",
    );
  });

  it("keeps replacement and cleanup events after another lane is interrupted or returns", async () => {
    const { figure, click } = await mount();
    await click("play");
    await advance(2000);
    expect(
      figure
        .querySelector(".fx-marble__event--cancelled")
        ?.getAttribute("data-phase"),
    ).toBe("current");
    await advance(1000);
    expect(
      figure
        .querySelector('.fx-marble__row--output [data-tick="3"]')
        ?.getAttribute("data-phase"),
    ).toBe("current");
    await advance(2000);
    expect(figure.dataset.playing).toBe("false");
    expect(pendingFrames.size).toBe(0);
    expect(figure.querySelector("[data-play-label]")?.textContent).toBe(
      "Replay",
    );
    expect(
      figure
        .querySelector('.fx-marble__row--output [data-tick="5"]')
        ?.getAttribute("data-phase"),
    ).toBe("current");
    await click("play");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 0 / 5",
    );
  });

  it("pauses exactly, resumes without counting paused time, and preserves position when speed changes", async () => {
    const { figure, click } = await mount();
    await click("play");
    await advance(1500);
    await click("play");
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("1.5");
    await advance(10000);
    await click("play");
    await advance(500);
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("2");
    const speed = figure.querySelector<HTMLSelectElement>("select")!;
    speed.value = "0.25";
    speed.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    await advance(2000);
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("2.5");
  });

  it("scrubs and steps to exact ticks, clamps at boundaries, and announces simultaneous events", async () => {
    const { figure, click, seek } = await mount();
    await click("previous");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 0 / 5",
    );
    await seek(2);
    expect(figure.querySelector(".fx-marble__activity")?.textContent).toBe(
      "Tick 2. Input: b; Old: cancelled; New: start.",
    );
    expect(
      figure.querySelector("input")?.getAttribute("aria-valuetext"),
    ).toContain("Tick 2");
    await click("next");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 3 / 5",
    );
    await click("restart");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 0 / 5",
    );
    expect(figure.dataset.playing).toBe("false");
  });

  it("plays one figure at a time and leaves returned lanes visible during later cleanup", async () => {
    const [first, second] = await mountGroup(
      "input: a | . . .\noperator: ensuring(cleanup)\ninner cleanup: . ^ . . |\noutput: a . . . |",
      defaultSource,
    );
    await first.click("play");
    await advance(2000);
    expect(first.figure.dataset.playing).toBe("true");
    await second.click("play");
    expect(first.figure.dataset.playing).toBe("false");
    expect(second.figure.dataset.playing).toBe("true");
    await first.click("play");
    expect(second.figure.dataset.playing).toBe("false");
    await vi.waitFor(() => expect(pendingFrames.size).toBe(1));
    await advance(2000);

    expect(
      first.figure
        .querySelector('.fx-marble__row--inner [data-tick="4"]')
        ?.getAttribute("data-phase"),
    ).toBe("current");
    expect(first.figure.querySelector("[data-play-label]")?.textContent).toBe(
      "Replay",
    );
  });

  it("retains the mounted view through cached navigation while releasing background resources", async () => {
    const observers = new Set<object>();
    vi.spyOn(window, "IntersectionObserver").mockImplementation(
      class {
        constructor() {
          observers.add(this);
        }
        observe() {}
        disconnect() {
          observers.delete(this);
        }
      } as unknown as typeof IntersectionObserver,
    );
    const media = Object.assign(new EventTarget(), {
      matches: false,
    }) as MediaQueryList;
    const addMedia = vi.spyOn(media, "addEventListener");
    const removeMedia = vi.spyOn(media, "removeEventListener");
    vi.spyOn(window, "matchMedia").mockReturnValue(media);
    document.body.innerHTML = renderFxMarble(defaultSource)!;
    const figure = document.querySelector<HTMLElement>("figure")!;
    const button = figure.querySelector<HTMLButtonElement>(
      '[data-action="play"]',
    )!;
    const viewport = figure.querySelector<HTMLElement>(".fx-marble__viewport")!;
    const legend = figure.querySelector<HTMLDetailsElement>("details")!;
    const speed = figure.querySelector<HTMLSelectElement>("select")!;
    const fiber = Effect.runFork(page(document));
    disposers.push(async () => {
      await Effect.runPromise(Fiber.interrupt(fiber));
    });
    await vi.waitFor(() => expect(figure.dataset.enhanced).toBe("true"));
    speed.value = "0.25";
    speed.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    button.click();
    await vi.waitFor(() => expect(pendingFrames.size).toBe(1));
    await advance(4000);
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 1 / 5",
    );
    legend.open = true;
    viewport.scrollLeft = 140;

    window.dispatchEvent(new Event("pagehide"));
    await vi.waitFor(() => {
      expect(figure.dataset.playing).toBe("false");
      expect(pendingFrames.size).toBe(0);
      expect(observers.size).toBe(0);
      expect(removeMedia).toHaveBeenCalledTimes(1);
    });
    window.dispatchEvent(new Event("pageshow"));
    await vi.waitFor(() => {
      expect(observers.size).toBe(1);
      expect(addMedia).toHaveBeenCalledTimes(2);
    });
    expect(document.querySelector("figure")).toBe(figure);
    expect(figure.querySelector('[data-action="play"]')).toBe(button);
    expect(figure.dataset.playing).toBe("false");
    expect(figure.querySelector(".fx-marble__position")?.textContent).toBe(
      "Tick 1 / 5",
    );
    expect(speed.value).toBe("0.25");
    expect(legend.open).toBe(true);
    expect(viewport.scrollLeft).toBe(140);
    expect(pendingFrames.size).toBe(0);

    await disposers.pop()!();
    expect(observers.size).toBe(0);
    expect(removeMedia).toHaveBeenCalledTimes(2);
    expect(pendingFrames.size).toBe(0);
  });

  it("supports reduced motion without advancing a smooth playhead and restores static content on cleanup", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
    const { figure, click } = await mount();
    await click("play");
    await advance(500);
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("0");
    await advance(500);
    expect(figure.style.getPropertyValue("--fx-marble-time")).toBe("1");
    await disposers.pop()!();
    expect(
      figure.querySelector<HTMLElement>(".fx-marble__controls")?.hidden,
    ).toBe(true);
    expect(figure.hasAttribute("data-enhanced")).toBe(false);
  });
});
