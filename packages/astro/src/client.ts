import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Fx from "@typed/fx/Fx";
import * as Subject from "@typed/fx/Subject";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { DomRenderEvent } from "@typed/template/RenderEvent";
import * as Component from "./Component.js";

interface Request {
  readonly component: Parameters<typeof Component.view>[0];
  readonly props: Record<string, unknown>;
  readonly slots: Record<string, string>;
  readonly client: string;
  readonly resolve: () => void;
  readonly reject: (reason: unknown) => void;
}

const islands = new WeakMap<HTMLElement, (request: Request) => void>();

/** Adopt only this island's slots; nested islands keep their own renderer ownership. */
function slotsFromAstro(
  element: HTMLElement,
  slots: Record<string, string>,
  initialized: boolean,
): Component.Slots {
  const existing = Array.from(element.querySelectorAll<HTMLElement>("astro-slot")).filter(
    (slot) => slot.closest("astro-island") === element,
  );

  return Object.fromEntries(
    Object.entries(slots).map(([name, content]) => {
      let slot = existing.find((node) => (node.getAttribute("name") ?? "default") === name);
      if (!slot) {
        slot = element.ownerDocument.createElement("astro-slot");
        if (name !== "default") slot.setAttribute("name", name);
        // Only Astro's trusted slot transport crosses this HTML boundary, never component props.
        slot.innerHTML = content;
      } else if (initialized && slot.innerHTML !== content) {
        // Astro reserializes live child DOM on parent updates. Only replace content that differs.
        slot.innerHTML = content;
      }
      return [name, Fx.succeed(DomRenderEvent(slot))];
    }),
  );
}

/**
 * Creates Astro's native hydration entry. Each island owns its reactive render
 * lifetime; replacement and unmount close the previous render before proceeding.
 *
 * @since 1.0.0
 * @category Hydration and lifecycle
 */
export default (element: HTMLElement) =>
  (
    component: unknown,
    props: Record<string, unknown>,
    slots: Record<string, string> = {},
    { client }: { client: string } = { client: "load" },
  ): Promise<void> => {
    if (!Component.isComponent(component)) {
      return Promise.reject(
        new TypeError("@typed/astro requires a component created with component"),
      );
    }

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const submit = islands.get(element) ?? mount(element);
    submit({ component, props, slots, client, resolve, reject });

    return promise;
  };

function mount(element: HTMLElement): (request: Request) => void {
  const requests = Subject.unsafeMake<Request | null>();
  let current: Request | null = null;
  let initialized = false;

  const rendering = requests.pipe(
    Fx.switchMap((request) => {
      let ready = false;

      return Fx.unwrapScoped(
        Effect.sync(() => {
          if (request === null || request !== current) return Fx.empty;

          if (request.client === "only" && !initialized) element.replaceChildren();
          const children = slotsFromAstro(element, request.slots, initialized);
          initialized = true;

          return render(Component.view(request.component, request.props, children), element).pipe(
            Fx.provide(DomRenderTemplate.using(element.ownerDocument)),
            Fx.tap(() => {
              ready = true;
              request.resolve();
            }),
            Fx.continueWith(() =>
              ready ? Fx.never : Fx.die(new Error("Typed component completed without rendering")),
            ),
          );
        }),
      ).pipe(
        Fx.catchCause((cause) => {
          if (request !== null && request === current && !Cause.hasInterruptsOnly(cause)) {
            if (!ready) request.reject(cause);
            else element.dispatchEvent(new CustomEvent("typed:error", { detail: cause }));
          }

          return Fx.empty;
        }),
      );
    }),
    Fx.ensuring(
      Effect.sync(() => {
        if (islands.get(element) === submit) islands.delete(element);
        element.removeEventListener("astro:unmount", unmount);
      }),
    ),
  );

  const fiber = Effect.runFork(Effect.scoped(Fx.drain(rendering)));

  function submit(request: Request) {
    current?.resolve();
    current = request;
    Effect.runFork(requests.onSuccess(request));
  }

  function unmount() {
    current?.resolve();
    current = null;
    initialized = false;

    Effect.runFork(
      requests.onSuccess(null).pipe(
        Effect.andThen(() => {
          if (current !== null) return Effect.void;

          if (islands.get(element) === submit) islands.delete(element);
          return Fiber.interrupt(fiber);
        }),
      ),
    );
  }

  islands.set(element, submit);
  element.addEventListener("astro:unmount", unmount);

  return submit;
}
