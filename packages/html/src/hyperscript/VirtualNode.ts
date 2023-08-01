import { Placeholder } from '../Placeholder.js'
import { HTMLElementProperties, PropsMap } from '../generic-property-types.js'

export type Selector<TagName extends Selector.TagName, S extends string = never> =
  | TagName
  | `${TagName}${Selector.ValidClassNameOrId<S>}`

export namespace Selector {
  export type TagName = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap

  export type ClassNameOrId = `.${string}` | `#${string}`

  // We need to utilize a recursive parser here because ClassNameOrId cannot represent
  // the recursive nature of the selector string. At this time, it doesn't not validate that
  // there is only 1 ID per selector as HTML would require.
  export type ValidClassNameOrId<T extends string> = T extends ClassNameOrId
    ? T
    : T extends `${ClassNameOrId}, ${infer R}`
    ? T extends `${infer F}, ${R}`
      ? `${F}, ${ValidClassNameOrId<R>}`
      : never
    : ClassNameOrId

  export type TagNameOf<T> = T extends keyof HTMLElementTagNameMap
    ? T
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends `${infer F}.${infer _}`
    ? TagNameOf<F>
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends `${infer F}#${infer _}`
    ? TagNameOf<F>
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type ClassNameOrIdOf<T> = T extends `${infer _}.${infer R}`
    ? `.${R}`
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    T extends `${infer _}#${infer R}`
    ? `#${R}`
    : never

  export type PropsFor<K> = K extends keyof PropsMap ? PropsMap[K] : HTMLElementProperties

  // TODO: Parse out class names and ids
}

export interface VirtualNode<
  TagName extends Selector.TagName,
  S extends string,
  Props extends Selector.PropsFor<TagName>,
  Children extends VirtualNodeChildren,
> {
  readonly selector: Selector<TagName, S>
  readonly props: Props
  readonly children: Children
}

export type VirtualNodeChild =
  | string
  | number
  | boolean
  | VirtualNode<any, any, any, any>
  | Placeholder.AnyOf<string | number | boolean | VirtualNode<any, any, any, any>>

export type VirtualNodeChildren = ReadonlyArray<VirtualNodeChild>

export function VirtualNode<
  const S extends Selector<any, any>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  const Props extends Selector.PropsFor<Selector.TagNameOf<S>> = never,
  const Children extends VirtualNodeChildren = [],
>(
  selector: S,
  props?: Props | null,
  ...children: Children
): VirtualNode<Selector.TagNameOf<S>, Selector.ClassNameOrIdOf<S>, Props, Children> {
  return {
    selector: selector as any,
    props: props || ({} as Props),
    children,
  }
}

// const div: VirtualNode<
//   'div',
//   '.foo#bar#foo.bar',
//   { readonly className: 'foo' },
//   readonly [
//     VirtualNode<'p', never, HTMLParagraphElementProperties, readonly [Fx.Fx<never, never, string>]>,
//   ]
// > = VirtualNode(
//   'div.foo#bar#foo.bar',
//   {
//     className: 'foo',
//   },
//   h('p', null, Fx.succeed('Hello World')),
// )
