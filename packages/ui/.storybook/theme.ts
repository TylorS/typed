import { Fx } from "@typed/fx";
import { Effect, Fiber } from "effect";

export type ColorTheme = "matrix" | "matrix-light";

const isColorTheme = (value: string | null | undefined): value is ColorTheme =>
  value === "matrix" || value === "matrix-light";

const parentRoot = (view: Window): HTMLElement | undefined => {
  try {
    return view.top !== view ? view.top?.document.documentElement : undefined;
  } catch {
    // Cross-origin embeds follow their own saved or system preference.
    return undefined;
  }
};

const savedTheme = (view: Window): string | null => {
  try {
    return view.localStorage.getItem("typed-theme");
  } catch {
    return null;
  }
};

const readTheme = (
  view: Window,
  root: HTMLElement | undefined,
  system: MediaQueryList,
): ColorTheme => {
  const inherited = root?.dataset.theme;
  const saved = savedTheme(view);
  return isColorTheme(inherited)
    ? inherited
    : isColorTheme(saved)
      ? saved
      : system.matches
        ? "matrix"
        : "matrix-light";
};

/** A suspended document releases observation and resubscribes when restored from BFCache. */
const pageActive = (view: Window) =>
  Fx.callback<boolean>((emit) => {
    const hide = () => emit.succeed(false);
    const show = () => emit.succeed(true);
    view.addEventListener("pagehide", hide);
    view.addEventListener("pageshow", show);
    emit.succeed(true);
    return Effect.sync(() => {
      view.removeEventListener("pagehide", hide);
      view.removeEventListener("pageshow", show);
    });
  }).pipe(Fx.skipRepeats);

/** Native observation stays at this boundary; Fx owns its subscription and finalizer. */
const preferences = (view: Window, root: HTMLElement | undefined, system: MediaQueryList) =>
  Fx.callback<ColorTheme>((emit) => {
    const update = () => emit.succeed(readTheme(view, root, system));
    const storage = (event: StorageEvent) => {
      if (event.key === "typed-theme" || event.key === null) update();
    };
    const observer = new MutationObserver(update);
    if (root) observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    view.addEventListener("storage", storage);
    system.addEventListener("change", update);
    update();
    return Effect.sync(() => {
      observer.disconnect();
      view.removeEventListener("storage", storage);
      system.removeEventListener("change", update);
    });
  });

/** Follow the documentation's theme without replacing the story or its state. */
export function observeTheme(onChange: (theme: ColorTheme) => void, view: Window = window) {
  const root = parentRoot(view);
  const system = view.matchMedia("(prefers-color-scheme: dark)");
  const changes = pageActive(view).pipe(
    Fx.switchMap((active) => (active ? preferences(view, root, system) : Fx.empty)),
  );
  const themes = Fx.concat(
    Fx.sync(() => readTheme(view, root, system)),
    changes,
  ).pipe(Fx.skipRepeats);
  const fiber = Effect.runFork(
    Effect.scoped(
      Fx.observe(themes, (theme) =>
        Effect.sync(() => {
          view.document.documentElement.dataset.theme = theme;
          onChange(theme);
        }),
      ),
    ),
  );
  return () => Effect.runPromise(Fiber.interrupt(fiber));
}
