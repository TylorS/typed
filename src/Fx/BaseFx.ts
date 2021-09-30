export abstract class BaseFx<Type extends string, R, A> {
  readonly _R!: (r: R) => void // Utilize function parameter to encode Contravariance in R param
  readonly _A!: () => A // Utilize function return type to encode Covariance in A param

  constructor(readonly type: Type) {}
}

export type TypeOfBaseFx<A> = [A] extends [BaseFx<infer Type, any, any>] ? Type : never

export type RequirementsOfBaseFx<A> = [A] extends [BaseFx<any, infer R, any>] ? R : unknown

export type ErrorOfBaseFx<A> = [A] extends [BaseFx<any, infer E, any>] ? E : never

export type OutputOfBaseFx<A> = [A] extends [BaseFx<any, any, infer R>] ? R : never
