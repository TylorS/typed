import * as Fx from "@typed/fx/Fx";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import type { PropsSource } from "../view.js";

/** RefSubject is both Effect and Fx; prefer Fx to retain its live updates. */
export function sourceFx<A, E, R>(source: PropsSource<A, E, R>): Fx.Fx<A, E, R> {
  if (Fx.isFx(source)) return source;
  if (Effect.isEffect(source)) return Fx.fromEffect(source);
  if (Stream.isStream(source)) return Fx.fromStream(source);
  return Fx.succeed(source);
}
