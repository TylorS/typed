import { left, right } from 'fp-ts/es6/Either'
import { fromNullable } from 'fp-ts/es6/Option'
import { range } from 'fp-ts/es6/ReadonlyArray'
import { Int } from 'io-ts'
import { memoize, Schemable1, WithUnion1 } from 'io-ts/es6/Schemable'
import {
  always,
  array,
  boolean,
  char,
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
import { TypedSchemable1 } from './TypedSchemable'

export const URI = 'Smallspace/Source'
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  export interface URItoKind<A> {
    [URI]: Source<A>
  }
}

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind<A> {
    [URI]: Source<A>
  }
}

export type SmallspaceSchemableParams = {
  readonly string?: Source<string> // the characters in which to use to derive strings
  readonly stringSeperator?: string
  readonly bigIntMultiplier?: number
}

const DEFAULT_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function createSmallspaceSchemable(
  params: SmallspaceSchemableParams = {},
): TypedSchemable1<URI> {
  const { bigIntMultiplier = 1_333_333_333 } = params

  const schemable: TypedSchemable1<URI> = {
    URI,
    literal: (...values) => oneof(...values.map(always)),
    string: string(params.string ?? char(DEFAULT_CHARACTERS), params.stringSeperator),
    number,
    boolean,
    nullable: (s) => oneof(s, always(null)),
    type: record as Schemable1<URI>['type'],
    array: array as Schemable1<URI>['array'],
    tuple: tuple as Schemable1<URI>['tuple'],
    partial,
    record: (codomain) => (n) =>
      schemable.string(n).flatMap((key) => codomain(n).map((value) => ({ [key]: value }))),
    intersect: (right) => (left) => (n) =>
      left(n).flatMap((l) => right(n).map((r) => ({ ...l, ...r }))),
    sum: () => (members) => oneof(...(Object.values(members) as Array<Source<any>>)),
    lazy,
    union: oneof as WithUnion1<URI>['union'],
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

function lazy<A>(_id: string, f: () => Source<A>): Source<A> {
  const get = memoize<void, Source<A>>(f)

  return (n) => get()(n)
}

function partial<A>(props: { [K in keyof A]: Source<A[K]> }): Source<Partial<A>> {
  const entries = Object.entries(props) as Array<[keyof A, Source<unknown>]>
  const mapped = entries.map(([key, value]) => convertToPartial(key, value))
  const partialProps = Object.fromEntries(mapped)

  return record(partialProps) as Source<Partial<A>>
}

function convertToPartial<K extends PropertyKey, V>(
  key: K,
  value: Source<V>,
): [K, Source<V | undefined>] {
  return [key, oneof(value, always(undefined))]
}
