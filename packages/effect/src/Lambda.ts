import * as Option from '@effect/data/Option'

export interface Lambda {
  readonly In?: unknown
  readonly InConstraint?: unknown
  readonly Out: unknown
}

export namespace Lambda {
  export type Apply<L extends Lambda, I> = (L & { readonly In: I })['Out']

  export type Constraint<L extends Lambda> = L extends { readonly InConstraint: infer I } ? I : any
}

export namespace In {
  export interface ArrayLambda extends Lambda {
    readonly InConstraint: Array<any>
    readonly Out: this['In'] extends Array<infer R> ? R : never
  }

  export interface ReadonlyArrayLambda extends Lambda {
    readonly InConstraint: ReadonlyArray<any>
    readonly Out: this['In'] extends ReadonlyArray<infer R> ? R : never
  }

  export interface OptionLambda extends Lambda {
    readonly InConstraint: Option.Option<any>
    readonly Out: this['In'] extends Option.Option<infer R> ? R : never
  }
}

export namespace Out {
  export interface ArrayLambda extends Lambda {
    readonly Out: Array<this['In']>
  }

  export interface ReadonlyArrayLambda extends Lambda {
    readonly Out: ReadonlyArray<this['In']>
  }

  export interface OptionLambda extends Lambda {
    readonly Out: Option.Option<this['In']>
  }
}
