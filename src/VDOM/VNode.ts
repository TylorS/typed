import * as Fx from '@typed/fx'
// import { WritableKeys } from 'ts-toolbelt/out/Object/WritableKeys.js'

export type VNode<R, E> = TextVNode<R, E> | ElementVNode<keyof HTMLElementTagNameMap, R, E>

export namespace VNode {
  export type Text<R, E> = TextVNode<R, E>
  export type Element<Tag extends keyof HTMLElementTagNameMap, R, E> = ElementVNode<Tag, R, E>

  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends VNode<infer R, infer _>
    ? R
    : never

  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends VNode<infer _, infer E>
    ? E
    : never
}

export interface TextVNode<R, E> {
  readonly type: 'text'
  readonly textContent: string | Fx.Fx<R, E, string>
}

export function text<R = never, E = never>(
  textContent: string | Fx.Fx<R, E, string>,
): TextVNode<R, E> {
  return {
    type: 'text',
    textContent,
  }
}

export type VNodeChild<R, E> = VNode<R, E> | Fx.Fx<R, E, VNode<R, E>>

export type VNodeChildren<R, E> =
  | ReadonlyArray<VNodeChild<R, E>>
  | Fx.Fx<R, E, ReadonlyArray<VNodeChild<R, E>>>

export namespace VNodeChildren {
  export type ResourcesOf<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends VNodeChild<infer R, infer _>
    ? R
    : never
  export type ErrorsOf<T> = [T] extends [never]
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends VNodeChild<infer _, infer E>
    ? E
    : never
}

export interface ElementVNode<Tag extends keyof HTMLElementTagNameMap, R, E> {
  readonly type: 'element'
  readonly tag: Tag
  readonly props: PropsOf<Tag, R, E>
  readonly children: VNodeChildren<R, E>
}

// TODO: Handle Props Resources + Errors

export function element<
  TagName extends keyof HTMLElementTagNameMap,
  Props extends PropsOf<TagName, any, any>,
  Children extends VNodeChildren<any, any>,
>(
  tag: TagName,
  props: Props,
  children: Children,
): ElementVNode<TagName, VNodeChildren.ResourcesOf<Children>, VNodeChildren.ErrorsOf<Children>> {
  return {
    type: 'element',
    tag,
    props,
    children,
  }
}

// TODO: This probably needs to be better
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type PropsOf<TagName extends keyof HTMLElementTagNameMap, R, E> = {
  // TODO
}
