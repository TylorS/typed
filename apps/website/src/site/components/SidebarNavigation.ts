import * as Fx from "@typed/fx/Fx";
import { Effect } from "effect";
import { events } from "../Browser.js";

/** Observe native navigation geometry for the lifetime of the page bootstrap. */
export const sidebarNavigation = (document: Document): Effect.Effect<void> =>
  Effect.gen(function* () {
    const window = document.defaultView;
    if (!window) return;

    const sizeReferences = Effect.sync(() => {
      for (const sidebar of document.querySelectorAll<HTMLElement>(
        ".reference-layout > .docs-sidebar",
      )) {
        if (sidebar.clientHeight === 0) continue;
        // Reference headings vary in height. Reserve the actual space below them
        // until the sidebar reaches its sticky position; do not move the document.
        const top = sidebar.getBoundingClientRect().top;
        sidebar.style.maxHeight = `${Math.max(120, window.innerHeight - Math.max(105, top) - 24)}px`;
      }
    });

    const reveal = Effect.andThen(
      sizeReferences,
      Effect.sync(() => {
        const containers = new Set<HTMLElement>(
          document.querySelectorAll<HTMLElement>(".reference-layout > .docs-sidebar"),
        );
        for (const navigation of document.querySelectorAll<HTMLElement>("[data-docs-navigation]")) {
          const container = navigation.closest<HTMLElement>(".docs-sidebar, .mobile-nav");
          if (container) containers.add(container);
        }
        for (const container of containers) {
          const selected = container.querySelector<HTMLElement>('[aria-current="page"]');
          if (!selected || container.clientHeight === 0) continue;
          const item = selected.getBoundingClientRect();
          const viewport = container.getBoundingClientRect();
          if (item.top < viewport.top || item.bottom > viewport.bottom) {
            container.scrollTop +=
              item.top - viewport.top - (container.clientHeight - item.height) / 2;
          }
        }
      }),
    );

    yield* reveal;
    yield* Effect.all(
      [
        Fx.observe(events(document, "astro:page-load"), () => reveal),
        Fx.observe(events(window, "resize"), () => reveal),
        Fx.observe(events(window, "scroll", { passive: true }), () => sizeReferences),
        Fx.observe(
          events(document, "toggle", { capture: true }).pipe(
            Fx.filter(
              (event) => event.target instanceof window.HTMLDetailsElement && event.target.open,
            ),
          ),
          () => reveal,
        ),
      ],
      { concurrency: "unbounded", discard: true },
    );
  });
