import type { Service } from '@/Service/Service'

export const HAS = Symbol.for('@typed/fp/HAS')
export type HAS = typeof HAS

/**
 * Has acts as a placeholder environment for utilizing the
 */
export interface Has<Name extends string, A> {
  readonly [HAS]: {
    readonly [_ in Name]: () => A
  }
}

export function has<Name extends string, A>(
  service: Service<Name, A>,
  implementation: A,
): Has<Name, A> {
  return {
    [HAS]: { [service]: implementation },
  } as Has<Name, A>
}

export function from<Name extends string, A>(service: Service<Name, A>) {
  return (has: Has<Name, A>): A => (has[HAS] as any)[service]
}
