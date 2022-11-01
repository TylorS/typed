/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO: Constrain interpolated values to strings, numbers, booleans, null, undefined,

import { VNode } from './VNode.js'

// VNodes and arrays of those types
export function html<Values extends readonly Renderable<any, any>[]>(
  _template: TemplateStringsArray,
  ..._values: readonly [...Values]
): VNode<Renderable.ResourcesOf<Values[number]>, Renderable.ErrorsOf<Values[number]>> {
  // TODO: Implement conversion from template string to VNode

  return {} as any
}

export type Renderable<R, E> = ReadonlyArray<
  VNode<R, E> | string | boolean | number | null | undefined
>

export namespace Renderable {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export type ResourcesOf<T> = T extends Renderable<infer R, infer _> ? R : never
  export type ErrorsOf<T> = T extends Renderable<infer _, infer E> ? E : never
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
