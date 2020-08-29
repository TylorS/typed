import { left, right } from 'fp-ts/es6/Either'
import { fromNullable } from 'fp-ts/es6/Option'
import { range } from 'fp-ts/es6/ReadonlyArray'
import { Int } from 'io-ts'
import { memoize, Schemable2C, WithUnion2C } from 'io-ts/es6/Schemable'
import {
  always,
  array,
  boolean,
  char,
  Nat,
  number,
  oneof,
  record,
  Source,
  string,
  tuple,
} from 'smallspace'

import {
  Failure,
  Loading,
  NoData,
  RefreshingFailure,
  RefreshingSuccess,
  Success,
} from '../RemoteData'
import { uuid4 } from '../Uuid/uuid4'
import { TypedSchemable2C } from './TypedSchemable'

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

export type SmallspaceSchemableParams = {
  readonly string?: Source<Nat, string> // the characters in which to use to derive strings
  readonly stringSeperator?: string
  readonly bigIntMultiplier?: number
}

const DEFAULT_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function createSmallspaceSchemable(
  params: SmallspaceSchemableParams = {},
): TypedSchemable2C<URI, Nat> {
  const { bigIntMultiplier = 1_333_333_333 } = params

  const schemable: TypedSchemable2C<URI, Nat> = {
    URI,
    literal: (...values) => oneof(...values.map(always)),
    string: string(params.string ?? char(DEFAULT_CHARACTERS), params.stringSeperator),
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
    sum: () => (members) => oneof(...(Object.values(members) as Array<Source<Nat, any>>)),
    lazy,
    union: oneof as WithUnion2C<URI, Nat>['union'],
    set: (v) => (n) => v(n).map((v) => new Set([v])),
    map: (k, v) => (n) => k(n).flatMap((key) => v(n).map((value) => new Map([[key, value]]))),
    option: (s) => (n) =>
      schemable
        .nullable(s)(n)
        .map((v) => fromNullable(v)),
    either: (l, r) => (n) => [...l(n).map(left), ...r(n).map(right)],
    remoteData: (l, r) => (n) => [
      NoData,
      Loading,
      ...l(n).flatMap((left) => [Failure.of(left), RefreshingFailure.of(left)]),
      ...r(n).flatMap((right) => [Success.of(right), RefreshingSuccess.of(right)]),
    ],
    date: (n) => range(0, n).map((v) => new Date(v ** v)),
    uuid: (n) => range(0, n).map((v) => uuid4([v, v, v, v, v, v, v, v, v, v, v, v, v, v, v, v])),
    int: (n) => number(n).map((v) => Math.floor(v) as Int),
    bigint: (n) => number(n).map((v) => BigInt(v * bigIntMultiplier)),
    unknown: (n) => [
      {},
      ...schemable.record(number)(n),
      ...schemable.record(schemable.string)(n),
      ...schemable.option(number)(n),
      ...schemable.either(schemable.string, number)(n),
    ],
    newtype: (from) => from,
    refine: (refinement) => (from) => (n) => from(n).filter(refinement),
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
