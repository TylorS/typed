import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

export interface Placeholder<R = never, E = never, A = unknown> {
  readonly __Placeholder__: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

export namespace Placeholder {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer R, infer _E, any>]
    ? R
    : [T] extends [Fx.Fx<infer R, infer _E, infer _A>]
    ? R
    : [T] extends [Effect.Effect<infer R, infer _E, infer _A>]
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [null]
    ? never
    : [T] extends [undefined]
    ? never
    : [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer _R, infer _E>]
    ? _E
    : [T] extends [Fx.Fx<infer _R, infer _E, infer _A>]
    ? _E
    : [T] extends [Effect.Effect<infer _R, infer _E, infer _A>]
    ? _E
    : never

  export type ValuesOf<T> = [T] extends [null]
    ? never
    : [T] extends [undefined]
    ? never
    : [T] extends [never]
    ? never
    : [T] extends [Placeholder<infer _R, infer _E, infer A>]
    ? A
    : [T] extends [Fx.Fx<infer _R, infer _E, infer A>]
    ? A
    : [T] extends [Effect.Effect<infer _R, infer _E, infer A>]
    ? A
    : never
  /* eslint-enable @typescript-eslint/no-unused-vars */

  export function map<R = never, E = never, A = unknown, B = unknown>(
    placeholder: Placeholder<R, E, A>,
    f: (a: A) => B,
  ): Placeholder<R, E, B>

  export function map<R = never, E = never, A = unknown, B = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => B,
  ): Placeholder<R, E, B> | null | undefined

  export function map<R = never, E = never, A = unknown, B = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => B,
  ): Placeholder<R, E, B> | null | undefined {
    if (placeholder === null || placeholder === undefined) {
      return placeholder
    }

    if (Fx.isFx<R, E, A>(placeholder)) {
      return Fx.map(placeholder, f)
    }

    if (Effect.isEffect(placeholder)) {
      return Effect.map(placeholder as Effect.Effect<R, E, A>, f)
    }

    return f(placeholder as A) as Placeholder<R, E, B>
  }

  export function switchMap<R = never, E = never, A = unknown, R1 = never, E1 = never, B = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Fx.Fx<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined

  export function switchMap<R = never, E = never, A = unknown, R1 = never, E1 = never, B = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Fx.Fx<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined

  export function switchMap<R = never, E = never, A = unknown, R1 = never, E1 = never, B = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Fx.Fx<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined {
    if (placeholder === null || placeholder === undefined) {
      return placeholder
    }

    if (Fx.isFx<R, E, A>(placeholder)) {
      return Fx.switchMap(placeholder, f)
    }

    if (Effect.isEffect(placeholder)) {
      return Fx.switchMap(Fx.fromEffect(placeholder as Effect.Effect<R, E, A>), f)
    }

    return f(placeholder as A) as Placeholder<R | R1, E | E1, B>
  }

  export function switchMapEffect<
    R = never,
    E = never,
    A = unknown,
    R1 = never,
    E1 = never,
    B = unknown,
  >(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Effect.Effect<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined

  export function switchMapEffect<
    R = never,
    E = never,
    A = unknown,
    R1 = never,
    E1 = never,
    B = unknown,
  >(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Effect.Effect<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined

  export function switchMapEffect<
    R = never,
    E = never,
    A = unknown,
    R1 = never,
    E1 = never,
    B = unknown,
  >(
    placeholder: Placeholder<R, E, A> | null | undefined,
    f: (a: A) => Effect.Effect<R1, E1, B>,
  ): Placeholder<R | R1, E | E1, B> | null | undefined {
    if (placeholder === null || placeholder === undefined) {
      return placeholder
    }

    if (Fx.isFx<R, E, A>(placeholder)) {
      return Fx.switchMapEffect(placeholder, f)
    }

    if (Effect.isEffect(placeholder)) {
      return Fx.switchMapEffect(Fx.fromEffect(placeholder as Effect.Effect<R, E, A>), f)
    }

    return f(placeholder as A) as Placeholder<R | R1, E | E1, B>
  }

  export function asFx(placeholder: undefined): Fx.Fx<never, never, undefined>
  export function asFx(placeholder: void): Fx.Fx<never, never, void>
  export function asFx(placeholder: null): Fx.Fx<never, never, null>
  export function asFx<R = never, E = never, A = unknown>(
    placeholder: Placeholder<R, E, A> | null | undefined,
  ): Fx.Fx<R, E, A>

  export function asFx<R = never, E = never, A = unknown>(
    placeholder: Placeholder<R, E, A> | null | void,
  ): Fx.Fx<R, E, A> {
    if (Fx.isFx<R, E, A>(placeholder)) {
      return placeholder
    }

    if (Effect.isEffect(placeholder)) {
      return Fx.fromEffect(placeholder as Effect.Effect<R, E, A>)
    }

    return Fx.succeed(placeholder as A)
  }

  export function asRef<R = never, E = never, A = never>(
    placeholder: Placeholder<R, E, A>,
  ): Effect.Effect<Scope.Scope | R, never, Fx.RefSubject<E, A>>

  export function asRef<R = never, E = never, A = never>(
    placeholder: Placeholder<R, E, A> | null | undefined,
  ): Effect.Effect<Scope.Scope | R, never, Fx.RefSubject<E, A | null | undefined>>

  export function asRef<R = never, E = never, A = never>(
    placeholder: Placeholder<R, E, A> | null | undefined,
  ): Effect.Effect<Scope.Scope | R, never, Fx.RefSubject<E, A>> {
    if (Fx.isFx<R, E, A>(placeholder)) {
      return Fx.asRef(placeholder)
    }

    if (Effect.isEffect(placeholder)) {
      return Fx.makeRef(placeholder as Effect.Effect<R, E, A>)
    }

    return Fx.makeRef<never, E, A>(Effect.succeed(placeholder as A))
  }
}

declare global {
  // Builtins
  export interface String extends Placeholder<never, never, string> {}
  export interface Number extends Placeholder<never, never, number> {}
  export interface Boolean extends Placeholder<never, never, boolean> {}
  export interface Symbol extends Placeholder<never, never, symbol> {}
  export interface BigInt extends Placeholder<never, never, bigint> {}
  export interface Array<T>
    extends Placeholder<
      Placeholder.ResourcesOf<T>,
      Placeholder.ErrorsOf<T>,
      ReadonlyArray<Placeholder.ValuesOf<T>>
    > {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  export interface Object extends Placeholder<never, never, Object> {}

  // DOM types
  export interface Node extends Placeholder<never, never, Node> {}
  export interface DocumentFragment extends Placeholder<never, never, DocumentFragment> {}
  export interface Element extends Placeholder<never, never, Element> {}
  export interface HTMLElement extends Placeholder<never, never, HTMLElement> {}
  export interface SVGElement extends Placeholder<never, never, SVGElement> {}
}

declare module '@typed/fx' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Fx<R, E, A> extends Placeholder<R, E, A> {}
}

declare module '@effect/io/Effect' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Effect<R, E, A> extends Placeholder<R, E, A> {}
}
