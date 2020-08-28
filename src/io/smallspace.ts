import { memoize, Schemable2C } from 'io-ts/es6/Schemable'
import {
  always,
  array,
  boolean,
  Nat,
  number,
  oneof,
  record,
  Source,
  string,
  tuple,
} from 'smallspace'

export const URI = 'Smallspace/Source'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Source<E, A>
  }
}

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Source<E, A>
  }
}

export type CreateSchemableParams = {
  readonly string?: Source<Nat, string> // the characters in which to use to derive strings
  readonly stringSeperator?: string
}

export function createSchemable(params: CreateSchemableParams = {}): Schemable2C<URI, Nat> {
  const schemable: Schemable2C<URI, Nat> = {
    URI,
    literal: (...values) => oneof(...values.map(always)),
    string: string(params.string, params.stringSeperator),
    number,
    boolean,
    nullable: (s) => oneof(s, always(null)),
    type: record as Schemable2C<URI, Nat>['type'],
    array: array as Schemable2C<URI, Nat>['array'],
    tuple: tuple as Schemable2C<URI, Nat>['tuple'],
    partial,
    record: (codomain) => (n) =>
      schemable.string(n).flatMap((key) => codomain(n).map((value) => ({ [key]: value }))),
    intersect: (right) => (left) => (n) =>
      left(n).flatMap((l) => right(n).map((r) => ({ ...l, ...r }))),
    sum: (() => <A extends ReadonlyArray<A>>(members: { [K in keyof A]: Source<Nat, A[K]> }) =>
      oneof(...members)) as Schemable2C<URI, Nat>['sum'],
    lazy,
  }

  return schemable
}

function lazy<A>(_id: string, f: () => Source<Nat, A>): Source<Nat, A> {
  const get = memoize<void, Source<Nat, A>>(f)

  return (n) => get()(n)
}

function partial<A>(props: { [K in keyof A]: Source<Nat, A[K]> }): Source<Nat, Partial<A>> {
  const entries = Object.entries(props) as Array<[keyof A, Source<Nat, unknown>]>
  const mapped = entries.map(([key, value]) => convertToPartial(key, value))
  const partialProps = Object.fromEntries(mapped)

  return record(partialProps) as Source<Nat, Partial<A>>
}

function convertToPartial<K extends PropertyKey, V>(
  key: K,
  value: Source<Nat, V>,
): [K, Source<Nat, V | undefined>] {
  return [key, oneof(value, always(undefined))]
}
