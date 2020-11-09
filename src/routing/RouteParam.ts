export type RouteParam<K extends string> = `:${RemoveSyntax<K>}`

type RemoveSyntax<A> = A extends `:${infer R}` ? RemoveSyntax<R> : A
