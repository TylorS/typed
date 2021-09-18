export type Maybe<A> = None | Some<A>

export interface None {
  readonly type: 'None'
}

export interface Some<A> {
  readonly type: 'Some'
  readonly value: A
}

export const URI = 'Maybe'
export type URI = typeof URI

declare module '@/Hkt' {
  export interface UriToKind<A> {
    [URI]: Maybe<A>
  }
}
