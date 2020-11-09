type ParsePathname<I, AST> =
  I extends `${infer P}?${infer Rest}` ? [AST & { pathname: `/${P}` }, `?${Rest}`] :
  I extends `${infer P}#${infer Rest}` ? [AST & { pathname: `/${P}` }, `#${Rest}`] :
  I extends string ? [AST & { pathname: `/${I}` }, ''] : never

type ParseQuery<I, AST> =
  I extends `?${infer Q}#${infer Rest}` ? [AST & { query: ParseQueryItems<Q> }, `#${Rest}`] :
  I extends `?${infer Q}` ? [AST & { query: ParseQueryItems<Q> }, ''] : [AST, I]
type ParseQueryItems<I> =
  string extends I ? [] :
  I extends '' ? [] :
  I extends `${infer K}=${infer V}&${infer Rest}` ? [{ key: K, value: V }, ...ParseQueryItems<Rest>] :
  I extends `${infer K}&${infer Rest}` ? [{ key: K, value: null }, ...ParseQueryItems<Rest>] :
  I extends `${infer K}=${infer V}` ? [{ key: K, value: V }] :
  I extends `${infer K}` ? [{ key: K, value: null }] : []
type ParseHash<I, AST> = I extends `#${infer H}` ? AST & { hash: `#${H}` } : AST

export type ParsePath<I extends string> =
  ParsePathname<I, {}> extends [infer AST, infer Rest] ?
  ParseQuery<Rest, AST> extends [infer AST, infer Rest] ?
  ParseHash<Rest, AST> extends infer AST ?
  { [P in keyof AST as AST[P] extends '' ? never : P]: AST[P] } :
  never : never : never
