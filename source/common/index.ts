export type ArgsOf<A> = A extends (...args: infer R) => any ? R : never
