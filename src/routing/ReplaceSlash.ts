export type RemoveSlash<A extends string> = ReplacePrefix<ReplacePostfix<A>>

type ReplacePrefix<A extends string> = A extends `/${infer R}`
  ? ReplacePrefix<R>
  : A

type ReplacePostfix<A extends string> = A extends `${infer R}/`
  ? ReplacePostfix<R>
  : A
