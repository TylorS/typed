import * as Effect from '@effect/core/io/Effect'
import * as Maybe from '@tsplus/stdlib/data/Maybe'
import * as T from '@tsplus/stdlib/service/Tag'

export interface ParentElement {
  readonly parentElement: ParentNode & HTMLElement
}

export namespace ParentElement {
  export const Tag: T.Tag<ParentElement> = T.Tag<ParentElement>()
}

export const getParentElement: Effect.Effect<ParentElement, never, ParentElement> = Effect.service(
  ParentElement.Tag,
)

export const querySelector: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, Maybe.Maybe<A>> = <A extends HTMLElement>(
  selector: string,
) =>
  Effect.serviceWith(ParentElement.Tag, (p) =>
    Maybe.fromNullable(p.parentElement.querySelector<A>(selector)),
  )

export const querySelectorAll: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, ReadonlyArray<A>> = <A extends HTMLElement>(
  selector: string,
) =>
  Effect.serviceWith(
    ParentElement.Tag,
    (p): ReadonlyArray<A> => Array.from(p.parentElement.querySelectorAll<A>(selector)),
  )
