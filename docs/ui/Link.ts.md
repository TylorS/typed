---
title: Link.ts
nav_order: 4
parent: "@typed/ui"
---

## Link overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Link](#link)
  - [LinkProps (type alias)](#linkprops-type-alias)

---

# utils

## Link

**Signature**

```ts
export declare function Link<
  Props extends LinkProps,
  Children extends ReadonlyArray<Renderable<any, any>> = readonly []
>(
  { onClick, relative, replace, state, to, ...props }: Props,
  ...children: Children
): Fx.Fx<
  | Navigation.Navigation
  | CurrentRoute
  | RenderTemplate
  | Scope.Scope
  | Placeholder.Context<Props[keyof Props] | Children[number]>,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  RenderEvent
>
```

Added in v1.0.0

## LinkProps (type alias)

**Signature**

```ts
export type LinkProps = Omit<TypedPropertiesMap["a"], keyof URL> & {
  readonly to: string | Placeholder.Any<string>
  readonly relative?: boolean | Placeholder.Any<boolean>
  readonly replace?: boolean | Placeholder.Any<boolean>
  readonly state?: unknown | Placeholder.Any<unknown>
  readonly info?: unknown | Placeholder.Any<unknown>
  readonly reloadDocument?: boolean | Placeholder.Any<boolean>
}
```

Added in v1.0.0
