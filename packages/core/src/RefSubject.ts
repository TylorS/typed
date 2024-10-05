/**
 * Re-exports from @typed/fx/RefSubject
 * @since 1.0.0
 */
import type { CurrentEnvironment, Environment } from "@typed/environment";
import type * as RefSubject from "@typed/fx/RefSubject";
import { ComputedTypeId, RefSubjectTypeId } from "@typed/fx/TypeId";
import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Exit from "effect/Exit";
import type * as Scope from "effect/Scope";
import * as Fx from "./Fx.js";

/**
 * [RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)
 * @since 1.0.0
 */
export * from "@typed/fx/RefSubject";

/**
 * @since 1.0.0
 */
export const takeOneIfEnvironment: {
  (
    environments: ReadonlyArray<Environment>
  ): <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>
  ) => RefSubject.RefSubject<A, E, R | CurrentEnvironment>;

  <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): RefSubject.RefSubject<A, E, R | CurrentEnvironment>;
} = function takeOneIfEnvironment<A, E, R>(
  ...args:
    | [ReadonlyArray<Environment>]
    | [RefSubject.RefSubject<A, E, R>, ReadonlyArray<Environment>]
): any {
  if (args.length === 1) {
    return (fx: RefSubject.RefSubject<A, E, R>) =>
      takeOneIfEnvironment(fx, args[0]);
  }

  const [fx, environments] = args;
  return new RefSubjectSimpleFxTransform(
    fx,
    Fx.takeOneIfEnvironment(environments)
  );
};

/**
 * @since 1.0.0
 */
export const takeOneIfNotEnvironment: {
  (
    environments: ReadonlyArray<Environment>
  ): <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>
  ) => RefSubject.RefSubject<A, E, R | CurrentEnvironment>;

  <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): RefSubject.RefSubject<A, E, R | CurrentEnvironment>;
} = function takeOneIfNotEnvironment<A, E, R>(
  ...args:
    | [ReadonlyArray<Environment>]
    | [RefSubject.RefSubject<A, E, R>, ReadonlyArray<Environment>]
): any {
  if (args.length === 1) {
    return (fx: RefSubject.RefSubject<A, E, R>) =>
      takeOneIfNotEnvironment(fx, args[0]);
  }

  const [fx, environments] = args;
  return new RefSubjectSimpleFxTransform(
    fx,
    Fx.takeOneIfNotEnvironment(environments)
  );
};

/**
 * @since 1.0.0
 */
export const takeOneIfNotDomEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, R | CurrentEnvironment> =
  takeOneIfNotEnvironment(["dom", "test:dom"]);

/**
 * @since 1.0.0
 */
export const takeOneIfDomEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R> = takeOneIfEnvironment(
  ["dom", "test:dom"]
);

/**
 * @since 1.0.0
 */
export const takeOneIfNotServerEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R> =
  takeOneIfNotEnvironment(["server", "test:server"]);

/**
 * @since 1.0.0
 */
export const takeOneIfServerEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R> = takeOneIfEnvironment(
  ["server", "test:server"]
);

/**
 * @since 1.0.0
 */
export const takeOneIfNotStaticEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R> =
  takeOneIfNotEnvironment(["static", "test:static"]);

/**
 * @since 1.0.0
 */
export const takeOneIfStaticEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R> = takeOneIfEnvironment(
  ["static", "test:static"]
);

class RefSubjectSimpleFxTransform<A, E, R, R2>
  extends Fx.FxEffectBase<A, E, R | R2 | Scope.Scope, A, E, R>
  implements RefSubject.RefSubject<A, E, R | R2>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  readonly version: Effect.Effect<number, E, R>;
  readonly interrupt: Effect.Effect<void, never, R>;
  readonly subscriberCount: Effect.Effect<number, never, R>;

  constructor(
    readonly ref: RefSubject.RefSubject<A, E, R>,
    readonly transform: (
      fx: Fx.Fx<A, E, Scope.Scope | R>
    ) => Fx.Fx<A, E, Scope.Scope | R | R2>
  ) {
    super();

    this.version = ref.version;
    this.interrupt = ref.interrupt;
    this.subscriberCount = ref.subscriberCount;
    this._effect = ref;
  }

  toFx(): Fx.Fx<A, E, R | R2 | Scope.Scope> {
    return this.transform(this.ref);
  }

  toEffect(): Effect.Effect<A, E, R> {
    return this.ref;
  }

  runUpdates<E2, R2, C>(
    run: (ref: RefSubject.GetSetDelete<A, E, R>) => Effect.Effect<C, E2, R2>
  ): Effect.Effect<C, E2, R | R2> {
    return this.ref.runUpdates(run);
  }

  unsafeGet: () => Exit.Exit<A, E> = () => this.ref.unsafeGet();

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.ref.onFailure(cause);
  }

  onSuccess(value: A): Effect.Effect<unknown, never, R> {
    return this.ref.onSuccess(value);
  }
}
