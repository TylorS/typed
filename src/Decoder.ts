import * as fn from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { Refinement } from 'fp-ts/Refinement'

/**
 * Construct a branded type. It remains compatible with the underlying type A, but
 * is given additional structure to differentiate this A from other As.
 */
export type Branded<Brand, A> = A & { readonly __brand__: Brand }

/**
 * A curried functon for helping to construct certain kinds of brands
 */
export const Branded: <B extends Branded<any, any>>() => <A extends BrandValue<B>>(
  value: A,
) => Branded<BrandOf<B>, A> = fn.constant(fn.unsafeCoerce)

/**
 * Extract the Brand of a given Branded Type
 */
export type BrandOf<A> = A extends Branded<infer R, unknown> ? R : never

/**
 * Extract the underlying value of a Branded type.
 */
export type BrandValue<A> = A extends Branded<BrandOf<A>, infer R> ? R : never

/**
 * Construct a branded type.
 */
export const brand: <B extends Branded<any, any>>(value: BrandValue<B>) => B = fn.unsafeCoerce

/** AST */

export type Decoder<I, O> =
  | Refine<I, O extends I ? O : never>
  | DecodeWith<I, O>
  | WithResult<I, O>
  | Compose<I, any, O>
  | Union<readonly [Decoder<unknown, unknown>, ...Decoder<unknown, unknown>[]], I, O>
  | Lazy<I, O>
  | Struct<I, O>
  | List<any, I, O>

export type NonEmptyArray<A> = readonly [A, ...A[]]

export type InputOf<A> = A extends Decoder<infer R, any> ? R : never
export type OutputOf<A> = A extends Decoder<any, infer R> ? R : never

export type IsUnknown<A> = [A] extends [unknown] ? ([unknown] extends [A] ? true : false) : false

export type Refine<A, B extends A> = {
  readonly _tag: 'refine'
  readonly expected: string
  readonly refinement: Refinement<A, B>
}

/**
 * Lifts a refinement into a decoder
 */
export const refine = <A, B extends A>(
  expected: string,
  refinement: Refinement<A, B>,
): Refine<A, B> => ({
  _tag: 'refine',
  expected,
  refinement,
})

export const isRefine = <I, O>(
  decoder: Decoder<I, O>,
): decoder is Refine<I, O extends I ? O : never> => decoder._tag === 'refine'

export type DecodeWith<A, B> = {
  readonly _tag: 'decodeWith'
  readonly expected: string
  readonly f: (value: A) => B
}

/**
 * Lift a function into a decoder
 */
export const decodeWith = <A, B>(expected: string, f: (value: A) => B): DecodeWith<A, B> => ({
  _tag: 'decodeWith',
  expected,
  f,
})

export const isDecodeWith = <I, O>(decoder: Decoder<I, O>): decoder is DecodeWith<I, O> =>
  decoder._tag === 'decodeWith'

export type WithResult<A, B> = {
  readonly _tag: 'withResult'
  readonly f: (input: A) => DecodeResult<B>
}

export const withResult = <A, B>(f: (input: A) => DecodeResult<B>): WithResult<A, B> => ({
  _tag: 'withResult',
  f,
})

export const isWithResult = <I, O>(decoder: Decoder<I, O>): decoder is WithResult<I, O> =>
  decoder._tag === 'withResult'

export type DecodeResult<A> = DecodeFailure | DecodeSuccess<A> | DecodeBoth<A>

export const matchDecodeResult = <A, B, C, D>(
  onFailure: (errors: DecodeErrors) => A,
  onSuccess: (value: B) => C,
  onBoth: (value: B, errors: DecodeErrors) => D,
) => (result: DecodeResult<B>): A | C | D => {
  switch (result._tag) {
    case 'both':
      return onBoth(result.value, result.errors)
    case 'failure':
      return onFailure(result.errors)
    case 'success':
      return onSuccess(result.value)
  }
}

export type DecodeFailure = {
  readonly _tag: 'failure'
  readonly errors: DecodeErrors
}

export const failure = (errors: DecodeErrors): DecodeFailure => ({ _tag: 'failure', errors })

export const isFailure = <A>(result: DecodeResult<A>): result is DecodeFailure =>
  result._tag === 'failure'

export type DecodeSuccess<A> = {
  readonly _tag: 'success'
  readonly value: A
}

export const success = <A>(value: A): DecodeSuccess<A> => ({ _tag: 'success', value })

export const isSuccess = <A>(result: DecodeResult<A>): result is DecodeSuccess<A> =>
  result._tag === 'success'

export type DecodeBoth<A> = {
  readonly _tag: 'both'
  readonly value: A
  readonly errors: DecodeErrors
}

export const both = <A>(value: A, errors: DecodeErrors): DecodeBoth<A> => ({
  _tag: 'both',
  value,
  errors,
})

export const isBoth = <A>(result: DecodeResult<A>): result is DecodeBoth<A> =>
  result._tag === 'both'

export type Compose<A, B, C> = {
  readonly _tag: 'compose'
  readonly from: Decoder<A, B>
  readonly to: Decoder<B, C>
}

/**
 * Compose 2 decoders
 */
export const compose = <A, B, C>(from: Decoder<A, B>, to: Decoder<B, C>): Compose<A, B, C> => ({
  _tag: 'compose',
  from,
  to,
})

export const isCompose = <I, O>(decoder: Decoder<I, O>): decoder is Compose<I, any, O> =>
  decoder._tag === 'compose'

export type Union<Members extends NonEmptyArray<Decoder<any, any>>, I, O> = Branded<
  { readonly I: I; readonly O: O },
  {
    readonly _tag: 'union'
    readonly members: Members
  }
>

/**
 * Construct a union of decoders
 */
export const union = <
  Members extends NonEmptyArray<Decoder<any, any>>,
  I = InputOf<Members[number]>,
  O = OutputOf<Members[number]>
>(
  ...members: Members
): Union<Members, I, O> => brand({ _tag: 'union', members })

export const isUnion = <I, O>(
  decoder: Decoder<I, O>,
): decoder is Union<NonEmptyArray<Decoder<any, any>>, I, O> => decoder._tag === 'union'

export type Intersect<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? Intersect<Tail, R & Head>
  : R

export type Lazy<A, B> = {
  readonly _tag: 'lazy'
  readonly expected: string
  readonly f: () => Decoder<A, B>
}

export const lazy = <A, B>(expected: string, f: () => Decoder<A, B>): Lazy<A, B> => ({
  _tag: 'lazy',
  expected,
  f,
})

export const isLazy = <I, O>(decoder: Decoder<I, O>): decoder is Lazy<I, O> =>
  decoder._tag === 'lazy'

export type Struct<I, O> = Branded<
  { readonly I: I; readonly O: O },
  {
    readonly _tag: 'struct'
    readonly properties: {
      readonly [K in keyof O]: Decoder<unknown, O[K]>
    }
  }
>

export const struct = <O>(
  properties: {
    readonly [K in keyof O]: Decoder<unknown, O[K]>
  },
): Struct<Readonly<Record<PropertyKey, unknown>>, O> => brand({ _tag: 'struct', properties })

export const isStruct = <I, O>(decoder: Decoder<I, O>): decoder is Struct<I, O> =>
  decoder._tag === 'struct'

export type List<M extends Decoder<any, any>, I, O> = Branded<
  { readonly I: I; readonly O: O },
  {
    readonly _tag: 'list'
    readonly member: M
  }
>

export const list = <M extends Decoder<any, any>>(
  member: M,
): List<M, ReadonlyArray<InputOf<M>>, ReadonlyArray<OutputOf<M>>> => brand({ _tag: 'list', member })

export const isList = <I, O>(decoder: Decoder<I, O>): decoder is List<Decoder<any, any>, I, O> =>
  decoder._tag === 'list'

/**
 * Construct an intersection of decoders
 */
export const intersection = <
  Members extends NonEmptyArray<Struct<Readonly<Record<PropertyKey, unknown>>, unknown>>
>(
  ...members: Members
) =>
  struct(Object.assign({}, ...members.map((m) => m.properties))) as Struct<
    Intersect<{ [K in keyof Members]: InputOf<Members> }>,
    Intersect<{ [K in keyof Members]: OutputOf<Members> }>
  >

/* Decoders */
export const string = refine('string', (x): x is string => typeof x === 'string')
export const number = refine('number', (x): x is number => typeof x === 'number')
export const boolean = refine('boolean', (x): x is boolean => typeof x === 'boolean')
export const unknownArray = refine('Array<unknown>', (x): x is ReadonlyArray<unknown> =>
  Array.isArray(x),
)
export const unknownRecord = refine(
  'Record<string, unknown>',
  (x): x is Readonly<Record<PropertyKey, unknown>> =>
    !!x && !Array.isArray(x) && typeof x === 'object',
)

const _null = refine('null', (x): x is null => x === null)

export const nullable = <I, O>(decoder: Decoder<I, O>) =>
  union<readonly [Decoder<I, O>, Refine<unknown, null>], I | null, O | null>(decoder, _null)

const _undefined = refine('undefined', (x): x is undefined => x === undefined)

export const optional = <I, O>(decoder: Decoder<I, O>) =>
  union<readonly [Decoder<I, O>, Refine<unknown, undefined>], I | undefined, O | undefined>(
    decoder,
    _undefined,
  )

/* Interpreters */
export const decode = <I, O>(decoder: Decoder<I, O>): ((input: I) => DecodeResult<O>) => {
  switch (decoder._tag) {
    case 'withResult':
      return decoder.f
    case 'decodeWith':
      return fn.flow(decoder.f, success)
    case 'refine':
      return (i) => (decoder.refinement(i) ? success(i) : failure([leaf(i, decoder.expected)]))
    case 'union': {
      const compiled = decoder.members.map(decode)

      return (i) => unionResults(compiled.map((f) => f(i)))
    }
    case 'struct': {
      const expectedKeys = Object.keys(decoder.properties)
      const compiled = Object.fromEntries(
        expectedKeys.map((k) => [k, decode(decoder.properties[k as keyof O])] as const),
      ) as { [K in keyof O]: (i: unknown) => DecodeResult<O[K]> }

      return (i) => {
        const actualKeys = Object.keys(i)
        const missingKeys = expectedKeys.filter((k) => !actualKeys.includes(k))
        const unexpectedKeys = actualKeys.filter((k) => !expectedKeys.includes(k))
        const remainingKeys = expectedKeys.filter((k) => !missingKeys.includes(k))
        const remainingResults: DecodeResult<any>[] = remainingKeys.map((k) =>
          fn.pipe(
            compiled[k as keyof O]((i as Readonly<Record<PropertyKey, unknown>>)[k]),
            matchDecodeResult(
              (errors) => failure([key(k, errors)]),
              (x) => success({ [k]: x }),
              (x, errors) => both(x, [key(k, errors)]),
            ),
          ),
        )
        const remaingResult = intersectResults(remainingResults)

        return unionResults([
          remaingResult,
          ...unexpectedKeys.map((x) => failure([unexpectedKey(x)])),
          ...missingKeys.map((x) => failure([missingKey(x)])),
        ])
      }
    }
    case 'list': {
      const { member } = decoder
      const compiled = decode(member)

      return (i) => {
        const results = ((i as unknown) as ReadonlyArray<unknown>).map((x, i) =>
          fn.pipe(
            x,
            compiled,
            matchDecodeResult(
              (errors) => failure([index(i, errors)]),
              success,
              (x, errors) => both(x, [index(i, errors)]),
            ),
          ),
        )
        const errors = [
          ...results.filter(isBoth).flatMap((b) => b.errors),
          ...results.filter(isFailure).flatMap((f) => f.errors),
        ]
        const values = fn.pipe(
          results,
          RA.filterMap((x) =>
            isBoth(x) ? O.some(x.value) : isSuccess(x) ? O.some(x.value) : O.none,
          ),
        )

        if (values.length === 0) {
          return failure((errors as unknown) as DecodeErrors)
        }

        return errors.length > 0
          ? both((values as any) as O, (errors as unknown) as DecodeErrors)
          : success((values as any) as O)
      }
    }
    case 'lazy': {
      let memoed: O.Option<(input: I) => DecodeResult<O>> = O.none

      return (i) =>
        fn.pipe(
          memoed,
          O.match(
            () => {
              const compiled = decode(decoder.f())

              memoed = O.some(compiled)

              return compiled(i)
            },
            (f) => f(i),
          ),
        )
    }
    case 'compose': {
      const { from, to } = decoder

      // Fuse 2 refinements
      if (isRefine(from) && isRefine(to)) {
        const expected = `${from.expected} & ${to.expected}`
        const decoder = refine(
          expected,
          (i: I): i is O extends I ? O : never => from.refinement(i) && to.refinement(i),
        )

        return decode(decoder)
      }

      // Fuse 2 decodes with
      if (isDecodeWith(from) && isDecodeWith(to)) {
        return decode(decodeWith(to.expected, fn.flow(from.f, to.f)))
      }

      // Fuse 2 withResults
      if (isWithResult(from) && isWithResult(to)) {
        return composeDecodeResultK(from.f, to.f)
      }

      // Fuse decodeWith w/ withResult
      if (isDecodeWith(from) && isWithResult(to)) {
        return decode(withResult(fn.flow(from.f, to.f)))
      }

      // Fuse withResult w/ decodeWith
      if (isWithResult(from) && isDecodeWith(to)) {
        return decode(
          withResult((i) =>
            fn.pipe(
              from.f(i),
              matchDecodeResult(
                (errors): DecodeResult<O> => failure(errors),
                fn.flow(to.f, success),
                (a, errors) => both(to.f(a), errors),
              ),
            ),
          ),
        )
      }

      return composeDecodeResultK(decode(from), decode(to))
    }
  }
}

const unionResults = (results: ReadonlyArray<DecodeResult<any>>): DecodeResult<any> => {
  const errors: DecodeError[] = []
  let value: O.Option<any> = O.none

  for (let i = 0; i < results.length; ++i) {
    const result = results[i]

    if (isFailure(result)) {
      errors.push(member(i, result.errors))
    }

    // Return the first success
    if (isSuccess(result) && O.isNone(value)) {
      value = O.some(result.value)
    }

    if (isBoth(result)) {
      errors.push(member(i, result.errors))

      if (O.isNone(value)) {
        value = O.some(result.value)
      }
    }
  }

  return fn.pipe(
    value,
    O.match(
      (): DecodeResult<any> => failure(errors as any),
      (value) => (isDecodeErrors(errors) ? both(value, errors) : success(value)),
    ),
  )
}

const intersectResults = (results: ReadonlyArray<DecodeResult<any>>): DecodeResult<any> => {
  const errors: DecodeError[] = []
  const values: any[] = []
  let shouldFail = false

  for (let i = 0; i < results.length; ++i) {
    const result = results[i]

    if (isFailure(result)) {
      shouldFail = true
      errors.push(member(i, result.errors))
    }

    // Return the first success
    if (isSuccess(result)) {
      values.push(result.value)
    }

    if (isBoth(result)) {
      errors.push(member(i, result.errors))
      values.push(result.value)
    }
  }

  if (shouldFail) {
    return failure(errors as any)
  }

  return isDecodeErrors(errors)
    ? both(Object.assign({}, ...values), errors)
    : success(Object.assign({}, ...values))
}

const composeDecodeResultK = <I, O>(
  from_: (i: I) => DecodeResult<unknown>,
  to_: (i: unknown) => DecodeResult<O>,
) => (i: I) =>
  fn.pipe(
    i,
    from_,
    matchDecodeResult(failure, to_, (a, errorsA) =>
      fn.pipe(
        a,
        to_,
        matchDecodeResult(
          (errorsB) => failure([...errorsA, ...errorsB]),
          success,
          (b, errorsB) => both(b, [...errorsA, ...errorsB]),
        ),
      ),
    ),
  )

export type DecodeErrors = readonly [DecodeError, ...DecodeError[]]

export const isDecodeErrors = (errors: readonly DecodeError[]): errors is DecodeErrors =>
  errors.length > 0

export type DecodeError = Leaf | Key | UnexpectedKey | MissingKey | Index | Member | Wrap

export interface Leaf {
  readonly _tag: 'leaf'
  readonly input: unknown
  readonly expected: string
}

export const leaf = (input: unknown, expected: string): Leaf => ({
  _tag: 'leaf',
  input,
  expected,
})

export interface Key {
  readonly _tag: 'key'
  readonly key: PropertyKey
  readonly errors: DecodeErrors
}

export const key = (key: PropertyKey, errors: DecodeErrors): Key => ({
  _tag: 'key',
  key,
  errors,
})

export interface UnexpectedKey {
  readonly _tag: 'unexpectedKey'
  readonly key: PropertyKey
}

export const unexpectedKey = (key: PropertyKey): UnexpectedKey => ({
  _tag: 'unexpectedKey',
  key,
})

export interface MissingKey {
  readonly _tag: 'missingKey'
  readonly key: PropertyKey
}

export const missingKey = (key: PropertyKey): MissingKey => ({
  _tag: 'missingKey',
  key,
})

export interface Index {
  readonly _tag: 'index'
  readonly index: number
  readonly errors: DecodeErrors
}

export const index = (index: number, errors: DecodeErrors): Index => ({
  _tag: 'index',
  index,
  errors,
})

export interface Member {
  readonly _tag: 'member'
  readonly index: number
  readonly errors: DecodeErrors
}

export const member = (index: number, errors: DecodeErrors): Member => ({
  _tag: 'member',
  index,
  errors,
})

export interface Wrap {
  readonly _tag: 'wrap'
  readonly message: string
  readonly errors: DecodeErrors
}

export const wrap = (message: string, errors: DecodeErrors): Wrap => ({
  _tag: 'wrap',
  message,
  errors,
})

export function stringifyErrors(errors: DecodeErrors): string {
  return toForest(errors).map(stringifyTree).join('\n')
}

export function stringifyError(error: DecodeError): string {
  return stringifyTree(toTree(error))
}

export const matchDecodeError = <R>(
  error: DecodeError,
  patterns: {
    leaf: (input: unknown, expected: string) => R
    key: (key: PropertyKey, errors: DecodeErrors) => R
    missingKey: (key: PropertyKey) => R
    unexpectedKey: (key: PropertyKey) => R
    index: (index: number, errors: DecodeErrors) => R
    member: (index: number, errors: DecodeErrors) => R
    wrap: (message: string, errors: DecodeErrors) => R
  },
): R => {
  switch (error._tag) {
    case 'leaf':
      return patterns.leaf(error.input, error.expected)
    case 'key':
      return patterns.key(error.key, error.errors)
    case 'missingKey':
      return patterns.missingKey(error.key)
    case 'unexpectedKey':
      return patterns.unexpectedKey(error.key)
    case 'index':
      return patterns.index(error.index, error.errors)
    case 'member':
      return patterns.member(error.index, error.errors)
    case 'wrap':
      return patterns.wrap(error.message, error.errors)
  }
}

// Internal helpers for stringifying errors

type Tree<A> = {
  value: A
  forest: Forest<A>
}

type Forest<A> = Tree<A>[]

function toForest(errors: DecodeErrors): Forest<string> {
  return errors.map(toTree)
}

// Builds string contexts for errors
function toTree(error: DecodeError): Tree<string> {
  return matchDecodeError(error, {
    leaf: (i, e) => ({ value: `Expected ${e} but got ${JSON.stringify(i)}`, forest: [] }),
    missingKey: (key) => ({
      value: `Missing Key '${key.toString()}'`,
      forest: [],
    }),
    unexpectedKey: (key) => ({
      value: `Unexpected Key '${key.toString()}'`,
      forest: [],
    }),
    key: (key, errors) => ({
      value: `Missing Key '${key.toString()}' encountered ${errors.length} error${
        errors.length > 1 ? `s` : ''
      }`,
      forest: toForest(errors),
    }),
    index: (index, errors) => ({
      value: `Index '${index}' encountered ${errors.length} error${errors.length > 1 ? `s` : ''}`,
      forest: toForest(errors),
    }),
    member: (index, errors) => ({
      value: `Member '${index}' encountered ${errors.length} error${errors.length > 1 ? `s` : ''}`,
      forest: toForest(errors),
    }),
    wrap: (value, errors) => ({ value, forest: toForest(errors) }),
  })
}

function stringifyTree(tree: Tree<string>): string {
  return tree.value + stringifyForest('\n', tree.forest)
}

// Builds a visual hierarchy of information
function stringifyForest(indentation: string, forest: Forest<string>): string {
  let r = ''
  const len = forest.length
  for (let i = 0; i < len; i++) {
    const tree = forest[i]
    const isLast = i === len - 1
    r += indentation + (isLast ? '└' : '├') + '─ ' + tree.value
    r += stringifyForest(indentation + (len > 1 && !isLast ? '│  ' : '   '), tree.forest)
  }
  return r
}

// Example
const d1 = union(string, number, boolean)
const f1 = decode(d1)

const log = <A>(x: DecodeResult<A>) =>
  fn.pipe(
    x,
    matchDecodeResult(
      (errors) => `Failure: ${stringifyErrors(errors)}`,
      (x) => `Success: ${JSON.stringify(x, null, 2)}`,
      (x, errors) => `Both: ${JSON.stringify(x, null, 2)} \n${stringifyErrors(errors)}`,
    ),
    (s) => console.log(`\n${s}`),
  )

const result1 = f1('string')
const result2 = f1(2)
const result3 = f1(false)
const result4 = f1(null)

log(result1)
log(result2)
log(result3)
log(result4)

/*
Both: "string"
Member '1' encountered 1 error
└─ Expected number but got "string"
Member '2' encountered 1 error
└─ Expected boolean but got "string"

Both: 2
Member '0' encountered 1 error
└─ Expected string but got 2
Member '2' encountered 1 error
└─ Expected boolean but got 2

Both: false
Member '0' encountered 1 error
└─ Expected string but got false
Member '1' encountered 1 error
└─ Expected number but got false

Failure: Member '0' encountered 1 error
└─ Expected string but got null
Member '1' encountered 1 error
└─ Expected number but got null
Member '2' encountered 1 error
└─ Expected boolean but got null
*/

const d2 = nullable(d1)
const f2 = decode(d2)

const result5 = f2(null)

log(result5)

/*
Both: null
Member '0' encountered 3 errors
├─ Member '0' encountered 1 error
│  └─ Expected string but got null
├─ Member '1' encountered 1 error
│  └─ Expected number but got null
└─ Member '2' encountered 1 error
   └─ Expected boolean but got null
*/

const d3 = compose(
  unknownRecord,
  struct({
    a: string,
    b: number,
    c: boolean,
  }),
)
const f3 = decode(d3)

const result6 = f3(null)
const result7 = f3({ a: '', b: 1, c: false })
const result8 = f3({ a: '', b: 1, c: false, d: 2 })
const result9 = f3({ a: '', b: 1 })

log(result6)
log(result7)
log(result8)
log(result9)

/*
Failure: Expected Record<string, unknown> but got null

Success: {
  "a": "",
  "b": 1,
  "c": false
}

Both: {
  "a": "",
  "b": 1,
  "c": false
}
Member '1' encountered 1 error
└─ Unexpected Key 'd'

Both: {
  "a": "",
  "b": 1
}
Member '1' encountered 1 error
└─ Missing Key 'c'
*/

const d4 = compose(unknownArray, list(string))
const f4 = decode(d4)

const result10 = f4(['hello', 'world'])
const result11 = f4([1, null, { foo: 'string' }])
const result12 = f4([1, 'one-good-value', { foo: 'string' }])

log(result10)
log(result11)
log(result12)

/*
Success: [
  "hello",
  "world"
]

Failure: Index '0' encountered 1 error
└─ Expected string but got 1
Index '1' encountered 1 error
└─ Expected string but got null
Index '2' encountered 1 error
└─ Expected string but got {"foo":"string"}

Both: [
  "one-good-value"
]
Index '0' encountered 1 error
└─ Expected string but got 1
Index '2' encountered 1 error
└─ Expected string but got {"foo":"string"}
*/
