// // Integrate with Schema for validation
// // Integrate with Optic for selecting and updating parts of the FormData
// // Provide combinators for using it on FormData
// import type { Option } from '@fp-ts/data/Option'
// import { NonEmptyReadonlyArray } from '@fp-ts/data/ReadonlyArray'
// import * as These from '@fp-ts/data/These'
// import * as DecodeError from '@fp-ts/schema/DecodeError'
// import * as Decoder from '@fp-ts/schema/Decoder'
// import * as S from '@fp-ts/schema/Schema'
// import * as OS from '@fp-ts/schema/data/Option'
// import * as GT from '@fp-ts/schema/data/filter/GreaterThan'
// import * as GTE from '@fp-ts/schema/data/filter/GreaterThanOrEqualTo'
// import * as LT from '@fp-ts/schema/data/filter/LessThan'
// import * as LTE from '@fp-ts/schema/data/filter/LessThanOrEqualTo'
// import * as MAXL from '@fp-ts/schema/data/filter/MaxLength'
// import * as MINL from '@fp-ts/schema/data/filter/MinLength'

// export interface Form<Fields extends FormFields> {
//   readonly fields: Fields
// }

// export function Form<Fields extends FormFields>(
//   makeFields: (field: FormField) => Fields,
// ): Form<Fields> {
//   return { fields: makeFields(FormField) }
// }

// export type FormFields = Readonly<Record<string, S.Schema<any>>>

// export type FormField = S.Schema<string> & {
//   readonly optional: S.Schema<Option<string>>
//   readonly minLength: (length: number) => FormField
//   readonly maxLength: (length: number) => FormField
//   readonly number: NumberField
//   readonly boolean: S.Schema<boolean>
// }

// export const FormField: FormField = makeFormField(S.string, S.number)

// // TODO: Make a File Schema

// export function makeFormField(s: S.Schema<string>, n: S.Schema<number>): FormField {
//   return {
//     ...s,
//     get optional() {
//       return OS.schema(s)
//     },
//     minLength: (length) => makeFormField(MINL.schema(length)(s), n),
//     maxLength: (length) => makeFormField(MAXL.schema(length)(s), n),
//     get number() {
//       return makeNumberField(n)
//     },
//     boolean: S.boolean,
//   }
// }

// export type NumberField = S.Schema<number> & {
//   readonly optional: S.Schema<Option<number>>
//   readonly gt: (amount: number) => NumberField
//   readonly gte: (amount: number) => NumberField
//   readonly lt: (amount: number) => NumberField
//   readonly lte: (amount: number) => NumberField
// }

// export function makeNumberField(schema: S.Schema<number>): NumberField {
//   return {
//     ...schema,
//     get optional() {
//       return OS.schema(schema)
//     },
//     gt: (amount) => makeNumberField(GT.schema(amount)(schema)),
//     gte: (amount) => makeNumberField(GTE.schema(amount)(schema)),
//     lt: (amount) => makeNumberField(LT.schema(amount)(schema)),
//     lte: (amount) => makeNumberField(LTE.schema(amount)(schema)),
//   }
// }

// export type Infer<T> = T extends Form<infer Fields>
//   ? { readonly [K in keyof Fields]: S.Infer<Fields[K]> }
//   : never

// declare const formData: FormData

// const example = Form((field) => ({
//   firstname: field.optional,
//   lastname: field,
//   age: field.number.gte(0).lte(100),
// }))

// const decodeExample = decodeFormData(example)

// const result = decodeExample(formData)

// export function sampleForm<Fields extends FormFields>(form: Form<Fields>) {
//   return (data: FormData): { readonly [K in keyof Fields]?: FormDataEntryValue | null } => {
//     const result: { [K in keyof Fields]?: FormDataEntryValue | null } = {}
//     for (const key of Object.keys(form.fields)) {
//       if (data.has(key)) {
//         result[key as any as keyof Fields] = data.get(key)
//       }
//     }
//     return result
//   }
// }

// export type Decoded<F extends Form<any>> = These.These<
//   NonEmptyReadonlyArray<DecodeError.DecodeError>,
//   Infer<F>
// >

// export function decodeFormData<Fields extends FormFields>(form: Form<Fields>) {
//   const decoder = Decoder.decoderFor(S.struct(form.fields))
//   const sample = sampleForm(form)

//   return (data: FormData): Decoded<typeof form> => decoder.decode(sample(data))
// }
