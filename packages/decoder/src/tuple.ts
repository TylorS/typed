// import type { ParseOptions } from "@effect/schema/AST"
// import * as ParseResult from "@effect/schema/ParseResult"
// import { Effect, pipe, ReadonlyArray as RA } from "effect"

// import { unknownArray } from "./array.js"
// import { compose } from "./compose.js"
// import type { Decoder, InputOf, OutputOf } from "./decoder.js"

// export const fromTuple = <Members extends RA.NonEmptyReadonlyArray<Decoder<any, any>>>(
//   ...members: Members
// ): Decoder<
//   { readonly [K in keyof Members]: InputOf<Members[K]> },
//   { readonly [K in keyof Members]: OutputOf<Members[K]> }
// > =>
// (i: { readonly [K in keyof Members]: InputOf<Members[K]> }, options?: ParseOptions) =>
//   Effect.gen(function*($) {
//     const results = yield* $(
//       Effect.all(
//         pipe(
//           i,
//           RA.map((ix, idx) =>
//             pipe(
//               members[idx](ix, options),
//               Effect.mapError((e: ParseResult.ParseError) => ParseResult.index(idx, e.errors)),
//               Effect.either
//             )
//           )
//         )
//       )
//     )
//     const [failures, successes] = RA.separate(results)

//     if (RA.isNonEmptyReadonlyArray(failures)) {
//       return yield* $(Effect.fail(ParseResult.parseError(failures)))
//     }

//     return successes as {
//       readonly [K in keyof Members]: OutputOf<Members[K]>
//     }
//   })

// export const tuple = <Members extends RA.NonEmptyReadonlyArray<Decoder<any, any>>>(
//   ...members: Members
// ): Decoder<unknown, { readonly [K in keyof Members]: OutputOf<Members[K]> }> =>
//   pipe(
//     unknownArray as unknown as Decoder<
//       unknown,
//       { readonly [K in keyof Members]: InputOf<Members[K]> }
//     >,
//     compose(fromTuple<Members>(...members))
//   )
