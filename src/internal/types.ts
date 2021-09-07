export type ArgsOf<A> = A extends (...args: infer R) => A ? R : never

export type ReturnOf<A> = A extends (...args: readonly any[]) => infer R ? R : never
