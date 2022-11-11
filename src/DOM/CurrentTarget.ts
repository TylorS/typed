import * as E from '@effect/core/io/Effect'
import * as T from '@tsplus/stdlib/service/Tag'

export interface CurrentTarget {
  readonly currentTarget: HTMLElement
}

export namespace CurrentTarget {
  export function make(currentTarget: HTMLElement): CurrentTarget {
    return {
      currentTarget,
    }
  }

  export const Tag = T.Tag<CurrentTarget>()
  export const get = E.serviceWith(Tag, (x) => x.currentTarget)
  export const provide = (currentTarget: HTMLElement) => E.provideService(Tag, make(currentTarget))
}
