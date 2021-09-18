export const constant =
  <A>(value: A) =>
  (..._: readonly unknown[]) =>
    value

export const constTrue: (..._: readonly unknown[]) => true = constant(true)

export const constFalse: (..._: readonly unknown[]) => false = constant(false)
