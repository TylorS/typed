import * as Effect from "effect/Effect";
import { Fx, Sink } from "@typed/fx";
import type { HtmlRenderEvent } from "../RenderEvent.js";
import { isHtmlRenderEvent } from "../RenderEvent.js";

export function takeOneIfNotRenderEvent<A, E, R>(
  fx: Fx.Fx<A, E, R>,
): Fx.Fx<A | HtmlRenderEvent, E, R> {
  return Fx.make<A | HtmlRenderEvent, E, R>((sink) =>
    Sink.withEarlyExit(sink, (sink) =>
      fx.run(
        Sink.make(sink.onFailure, (event) => {
          if (isHtmlRenderEvent(event) && !event.last) return sink.onSuccess(event);
          return Effect.flatMap(sink.onSuccess(event), () => sink.earlyExit);
        }),
      ),
    ),
  );
}
