import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";

export type Source<A, E = never, R = never> =
  | A
  | Effect.Effect<A, E, R>
  | Stream.Stream<A, E, R>
  | Fx.Fx<A, E, R>;

export function toFx<A, E, R>(source: Source<A, E, R>): Fx.Fx<A, E, R> {
  if (Fx.isFx(source)) return source;
  if (Effect.isEffect(source)) return Fx.fromEffect(source);
  if (Stream.isStream(source)) return Fx.fromStream(source);
  return Fx.succeed(source);
}
