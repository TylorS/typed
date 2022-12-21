/* Start Region: Parameter AST */

export type Param<A extends string> = `:${A}`

export type Optional<A extends string> = `${A}?`

export type Prefix<P extends string, A extends string> = `{${P}${A}}`

export type QueryParams<P extends string> = `\\?${P}`

export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`

export type ZeroOrMore<A extends string> = `${Param<A>}*`

export type OneOrMore<A extends string> = `${Param<A>}+`

export const unnamed = `(.*)` as const

export type Unnamed = typeof unnamed

/* End Region: Parameter AST */
