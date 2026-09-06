import {
  createElement,
  Suspense,
  use,
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import type { Scope } from "effect/Scope";
import * as Fiber from "effect/Fiber";
import * as Fx from "@typed/fx/Fx";
import * as Subject from "@typed/fx/Subject";
import { DomRenderTemplate, render } from "@typed/template/Render";
import type { Renderable } from "@typed/template/Renderable";
import { RenderTemplate } from "@typed/template/RenderTemplate";
import { rootEvents, type RootEventOptions } from "@typed/template/RootEvents";
import { useRuntime, type Runtime } from "./Runtime.js";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { Layer } from "effect";
import { cachedResource, type CachedResource } from "./internal/resource.js";

export interface TypedProps<T extends Renderable.Any, ER = never> {
  readonly value: T;
  /** Stable host identity; React useId supplies the default for SSR and hydration. */
  readonly id?: string;
  /** Caller-owned runtime; the component never disposes it. */
  readonly runtime?: Runtime<Exclude<Exclude<Renderable.Services<T>, RenderTemplate>, Scope>, ER>;
  /** Cancels pending server rendering. Pass the request's signal when aborting React SSR. */
  readonly signal?: AbortSignal;
  /** Per-event bubbling policy at the automatic host; updates retain its current rendering. */
  readonly stopPropagation?: RootEventOptions;
  /** Producer, renderer and runtime-layer failures. Normal cleanup interruption is excluded. */
  readonly onError?: (cause: Cause.Cause<Renderable.Error<T> | ER>) => void;
}

/** A Typed producer failure surfaced through React's server error callback or client Error Boundary. */
export class TypedRenderError<E> extends Error {
  readonly _tag = "TypedRenderError";
  constructor(override readonly cause: Cause.Cause<E>) {
    super("Typed rendering failed", { cause });
  }
}

const subscribe = () => () => {};
const clientSnapshot = () => false;
const serverSnapshot = () => true;

/** Typed's native callback ref owns rendering; React owns only the opaque host element. */
export function createTyped(
  serverBuild: boolean,
): <const T extends Renderable.Any, ER = never>(props: TypedProps<T, ER>) => ReactElement {
  return serverBuild ? ServerTyped : BrowserTyped;
}

function ServerTyped<const T extends Renderable.Any, ER = never>(
  props: TypedProps<T, ER>,
): ReactElement {
  const runtime = useRuntime(props.runtime);
  const server = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  // This owner is above its own Suspense boundary. Its pure initializer creates
  // no work, and the child reads one cached promise even across Suspense retries.
  const [initial] = useState(() =>
    server ? htmlResource(runtime, props.value, props.signal, props.onError) : undefined,
  );
  useEffect(() => initial?.retain(), [initial]);

  // The client snapshot change must not update a still-dehydrated boundary.
  // Reuse its element until actual component inputs change.
  return useMemo(
    () =>
      createElement(
        Suspense,
        { fallback: null },
        createElement(TypedContent<T, ER>, { ...props, runtime, initial }),
      ),
    [props.value, props.id, props.onError, props.stopPropagation, runtime, initial],
  );
}

function BrowserTyped<const T extends Renderable.Any, ER = never>(
  props: TypedProps<T, ER>,
): ReactElement {
  const runtime = useRuntime(props.runtime);

  return createElement(
    Suspense,
    { fallback: null },
    createElement(TypedContent<T, ER>, { ...props, runtime, initial: undefined }),
  );
}

function htmlResource<T extends Renderable.Any, ER>(
  runtime: NonNullable<TypedProps<T, ER>["runtime"]>,
  value: T,
  signal: AbortSignal | undefined,
  onError: TypedProps<T, ER>["onError"],
): CachedResource<string> {
  return cachedResource(
    (requestSignal) =>
      runtime
        .runPromiseExit(
          renderToHtmlString(value).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
          {
            signal: requestSignal,
          },
        )
        .then((exit) => {
          if (Exit.isSuccess(exit)) return exit.value;

          if (!Cause.hasInterruptsOnly(exit.cause)) onError?.(exit.cause);
          throw new TypedRenderError(exit.cause);
        }),
    signal,
  );
}

function TypedContent<const T extends Renderable.Any, ER = never>({
  value,
  id,
  runtime: explicitRuntime,
  initial,
  onError,
  stopPropagation,
}: TypedProps<T, ER> & { readonly initial: CachedResource<string> | undefined }): ReactElement {
  const runtime = useRuntime(explicitRuntime);
  const generatedId = useId();
  const host = useRef<HTMLElement | null>(null);

  const latestError = useRef(onError);
  latestError.current = onError;

  const markup = initial ? use(initial.read()) : "";
  const [initialHtml] = useState(() => ({ __html: markup }));

  const [failure, setFailure] = useState<TypedRenderError<Renderable.Error<T> | ER>>();
  const report = (cause: Cause.Cause<Renderable.Error<T> | ER>) => {
    if (latestError.current) latestError.current(cause);
    else setFailure(new TypedRenderError(cause));
  };

  type Mount = {
    readonly element: HTMLElement;
    readonly runtime: typeof runtime;
    readonly value: T;
  };

  const mounts = useMemo(() => Subject.unsafeMake<Mount | null>(1), []);
  const ref = useMemo(
    () => (element: HTMLElement | null) => {
      host.current = element;
      Effect.runFork(mounts.onSuccess(element ? { element, runtime, value } : null));
    },
    [mounts, runtime, value],
  );

  const lifecycle = useMemo(
    () =>
      cachedResource((signal) => {
        const rendering = mounts.pipe(
          Fx.switchMapEffect((mount) => {
            if (!mount) return Effect.void;

            const program = render(mount.value, mount.element).pipe(
              Fx.provide(DomRenderTemplate.using(mount.element.ownerDocument)),
              Fx.drain,
              Layer.effectDiscard,
              Layer.launch,
            );

            return Effect.acquireUseRelease(
              Effect.sync(() => mount.runtime.runFork(program)),
              Fiber.join,
              Fiber.interrupt,
            ).pipe(
              Effect.catchCause((cause) =>
                Cause.hasInterruptsOnly(cause) ? Effect.void : Effect.sync(() => report(cause)),
              ),
            );
          }),
        );

        return Effect.runPromiseExit(Effect.scoped(Fx.drain(rendering)), { signal });
      }),
    [mounts],
  );

  useLayoutEffect(() => {
    const release = lifecycle.retain();
    void lifecycle.read();

    return release;
  }, [lifecycle]);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;

    return runtime.runCallback(
      rootEvents(element, stopPropagation).pipe(Layer.effectDiscard, Layer.launch),
      {
        onExit: (exit) => {
          if (Exit.isFailure(exit) && !Cause.hasInterruptsOnly(exit.cause)) report(exit.cause);
        },
      },
    );
  }, [runtime, stopPropagation]);

  if (failure) throw failure;

  return createElement("div", {
    id: id ?? generatedId,
    ref,
    style: { display: "contents" },
    // Typed owns this opaque interior. The browser adopts server HTML directly
    // instead of replaying HTML producers (which may contain server-only code).
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: initialHtml,
  });
}
