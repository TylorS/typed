import { component } from "@typed/astro/Component";
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler } from "@typed/template";
import { Button } from "@typed/ui/Button";
import { Effect } from "effect";
import { events, whilePageActive } from "../Browser.js";

type ColorTheme = "matrix" | "matrix-light";
const colorTheme = (value: string | null): ColorTheme | undefined =>
  value === "matrix" || value === "matrix-light" ? value : undefined;

const savedTheme = (view: Window, fallback: ColorTheme | undefined): ColorTheme | undefined => {
  try {
    return colorTheme(view.localStorage.getItem("typed-theme"));
  } catch {
    return fallback;
  }
};

export default component(function* () {
  const preference = yield* RefSubject.make<ColorTheme | undefined>(undefined);
  const systemDark = yield* RefSubject.make(true);
  const theme = RefSubject.map(
    RefSubject.tuple([preference, systemDark]),
    ([saved, dark]): ColorTheme => saved ?? (dark ? "matrix" : "matrix-light"),
  );

  const attach = (element: HTMLButtonElement) => {
    const view = element.ownerDocument.defaultView!;
    const refreshPreference = Effect.gen(function* () {
      // Unavailable storage cannot erase a choice made in this still-live page.
      yield* RefSubject.set(preference, savedTheme(view, yield* preference));
    });
    return whilePageActive(
      view,
      Effect.gen(function* () {
        const system = view.matchMedia("(prefers-color-scheme: dark)");
        yield* refreshPreference;
        yield* RefSubject.set(systemDark, system.matches);
        yield* Fx.mergeAll(
          events<MediaQueryListEvent>(system, "change").pipe(
            Fx.tap((event) => RefSubject.set(systemDark, event.matches)),
          ),
          events<StorageEvent>(view, "storage").pipe(
            Fx.filter((event) => event.key === "typed-theme" || event.key === null),
            Fx.tap(() => refreshPreference),
          ),
          theme.pipe(
            Fx.tap((value) =>
              Effect.sync(() => {
                // The document root belongs to Astro; this is our one owned attribute.
                element.ownerDocument.documentElement.dataset.theme = value;
              }),
            ),
          ),
        ).pipe(Fx.drain);
      }),
    ).pipe(Effect.forkScoped);
  };

  return Button({
    content: "◐",
    ref: attach,
    props: {
      class: "btn btn-ghost btn-square theme-toggle",
      "aria-label": "Switch color theme",
      title: "Switch light / dark theme",
    },
    onclick: EventHandler.make((event: MouseEvent) =>
      Effect.gen(function* () {
        const next: ColorTheme = (yield* theme) === "matrix" ? "matrix-light" : "matrix";
        yield* RefSubject.set(preference, next);
        const view = (event.currentTarget as HTMLButtonElement).ownerDocument.defaultView!;
        try {
          view.localStorage.setItem("typed-theme", next);
        } catch {
          // A storage failure never prevents a change on the current page.
        }
      }),
    ),
  });
});
