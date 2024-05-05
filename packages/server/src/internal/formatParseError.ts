import * as AST from "@effect/schema/AST"
import type * as ParseResult from "@effect/schema/ParseResult"
import * as ReadonlyArray from "effect/Array"
import * as Effect from "effect/Effect"
import * as Equivalence from "effect/Equivalence"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Order from "effect/Order"

const getDescription = AST.getAnnotation<AST.DescriptionAnnotation>(
  AST.DescriptionAnnotationId
)

const getTitle = AST.getAnnotation<AST.TitleAnnotation>(AST.TitleAnnotationId)

const getMessage = AST.getAnnotation<AST.MessageAnnotation>(
  AST.MessageAnnotationId
)

const getIdentifier = AST.getAnnotation<AST.IdentifierAnnotation>(
  AST.IdentifierAnnotationId
)

const getExpected = (ast: AST.AST): Option.Option<string> =>
  getDescription(ast).pipe(
    Option.orElse(() => getTitle(ast)),
    Option.orElse(() => getIdentifier(ast))
  )

const stringifyExpected = (
  error: Exclude<ValidationError, { _tag: "Missing" }>
) => {
  const expected = Option.all({
    init: ReadonlyArray.init(error.expected),
    last: ReadonlyArray.last(error.expected)
  }).pipe(
    Option.map(({ init, last }) => init.length === 0 ? last : `${init.join(", ")} or ${last}`),
    Option.getOrElse(() => error.expected.join(" or "))
  )

  return expected
}

const stringifyError = (error: ValidationError) => {
  if (error.message) {
    return error.message
  }

  const position = error.position.reduce((prev, curr) => {
    if (typeof curr === "number") {
      return prev + `[${curr}]`
    }
    return prev + (prev ? "." : "") + curr
  }, "") || "value"

  if (error._tag === "Missing") {
    return `${position} is missing`
  }

  const expected = stringifyExpected(error)
  const received = JSON.stringify(error.received)

  return `${position} must be ${expected}, received ${received}`
}

type ValidationErrorBase = {
  position: Array<string | number>
  message?: string | undefined
}
type ValidationErrorUnexpected = ValidationErrorBase & {
  _tag: "Unexpected"
  expected: Array<string>
  received: unknown
}
type ValidationErrorMissing = ValidationErrorBase & { _tag: "Missing" }

const validationErrorUnexpected = (
  position: Array<string | number>,
  expected: Array<string>,
  received: unknown,
  message?: string | undefined
): ValidationErrorUnexpected => ({
  _tag: "Unexpected",
  position,
  expected,
  received,
  message
})

const validationErrorMissing = (
  position: Array<string | number>,
  message?: string | undefined
): ValidationErrorMissing => ({
  _tag: "Missing",
  position,
  message
})

type ValidationError = ValidationErrorUnexpected | ValidationErrorMissing

const formatParseErrors = (
  parseIssue: ParseResult.ParseIssue
): ReadonlyArray<ValidationError> => {
  if (parseIssue._tag === "TypeLiteral") {
    return parseIssue.errors.flatMap((error) => {
      if (error.error._tag === "Missing") {
        return [validationErrorMissing([error.key.toString()])]
      } else if (error.error._tag === "Unexpected") {
        return [validationErrorUnexpected([], [], "<unexpected>")]
      }

      return formatParseErrors(error.error).map((e) => ({
        ...e,
        position: [error.key.toString(), ...e.position]
      }))
    })
  } else if (parseIssue._tag === "Type") {
    return [
      validationErrorUnexpected(
        [],
        [
          getMessage(parseIssue.ast).pipe(
            Option.flatMap((f) => {
              const msg = f(parseIssue)

              if (Effect.isEffect(msg)) {
                return Option.none()
              }

              return Option.some(msg)
            }),
            Option.getOrElse(() => formatAST(parseIssue.ast))
          )
        ],
        parseIssue.actual,
        Option.getOrUndefined(parseIssue.message)
      )
    ]
  } else if (parseIssue._tag === "TupleType") {
    return parseIssue.errors.flatMap((error) => {
      if (error.error._tag === "Missing") {
        return [{ _tag: "Missing", position: [error.index] }]
      } else if (error.error._tag === "Unexpected") {
        return [validationErrorUnexpected([error.index], [], "<unexpected>")]
      }

      return formatParseErrors(error.error).map((e) => ({
        ...e,
        position: [error.index, ...e.position]
      }))
    })
  } else if (parseIssue._tag === "Union") {
    return parseIssue.errors.flatMap((error) => {
      if (error._tag === "Member") {
        return formatParseErrors(error.error)
      }

      return formatParseErrors(error)
    })
  } else if (parseIssue._tag === "Refinement") {
    return formatParseErrors(parseIssue.error)
  }

  return [
    validationErrorUnexpected([], [], "<unexpected>")
  ]
}

const formatAST = (ast: AST.AST) => {
  const expected = getExpected(ast)

  if (ast._tag === "TypeLiteral") {
    return "an object"
  }

  if (Option.isSome(expected)) {
    return expected.value as string
  }

  if (ast._tag === "Literal") {
    return JSON.stringify(ast.literal)
  }

  return JSON.stringify(ast)
}

export const formatParseError = (
  error: ParseResult.ParseError,
  parseOptions?: AST.ParseOptions
): string => {
  const errors = formatParseErrors(error.error)

  if (errors.length === 1) {
    return stringifyError(errors[0])
  }

  if (parseOptions?.errors === "all") {
    return errors.map(stringifyError).join(", ")
  }

  if (!ReadonlyArray.isNonEmptyReadonlyArray(errors)) {
    return `Unexpected validation errors: ${JSON.stringify(error)}`
  }

  const errorsWithMostPrecisePosition = pipe(
    errors,
    ReadonlyArray.groupWith(
      pipe(
        Equivalence.array(Equivalence.strict()),
        Equivalence.mapInput((e: ValidationError) => e.position)
      )
    ),
    ReadonlyArray.max((a, b) => {
      // use errors with the longest position
      const longestPositionOrdering = Order.number(
        a[0].position.length,
        b[0].position.length
      )

      if (longestPositionOrdering !== 0) {
        return longestPositionOrdering
      }

      // use errors with the greatest number of union cases
      const numberOfUnionMembersOrdering = Order.number(a.length, b.length)

      if (numberOfUnionMembersOrdering !== 0) {
        return numberOfUnionMembersOrdering
      }

      const aContainsUnexpected = a.some((e) => e._tag === "Unexpected")
      const bContainsUnexpected = b.some((e) => e._tag === "Unexpected")

      // use errors with the greatest number of union cases
      if (aContainsUnexpected && !bContainsUnexpected) {
        return 1
      } else if (!aContainsUnexpected && bContainsUnexpected) {
        return -1
      }

      return 0
    })
  )

  const errorsByTag = pipe(
    errorsWithMostPrecisePosition,
    ReadonlyArray.groupBy((error) => error._tag)
  )

  if ("Unexpected" in errorsByTag) {
    const unexpectedErrors = errorsByTag[
      "Unexpected"
    ] as Array<ValidationErrorUnexpected>

    const expected = unexpectedErrors.flatMap((e) => e.expected)

    if (ReadonlyArray.isNonEmptyArray(unexpectedErrors)) {
      return stringifyError({ ...unexpectedErrors[0], expected })
    }
  }

  if ("Missing" in errorsByTag) {
    const unexpectedErrors = errorsByTag["Missing"] as Array<ValidationErrorMissing>

    if (ReadonlyArray.isNonEmptyArray(unexpectedErrors)) {
      return stringifyError(unexpectedErrors[0])
    }
  }

  return `Unexpected validation errors: ${errors}`
}
