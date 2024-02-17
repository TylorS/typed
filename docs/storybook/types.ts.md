---
title: types.ts
nav_order: 5
parent: "@typed/storybook"
---

## types overview

Storybook types for Typed projects.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Decorator (type alias)](#decorator-type-alias)
  - [FrameworkOptions (type alias)](#frameworkoptions-type-alias)
  - [Loader (type alias)](#loader-type-alias)
  - [Meta (type alias)](#meta-type-alias)
  - [Preview (type alias)](#preview-type-alias)
  - [RenderContext](#rendercontext)
  - [StoryContext (type alias)](#storycontext-type-alias)
  - [StoryObj (type alias)](#storyobj-type-alias)
  - [StorybookConfig (type alias)](#storybookconfig-type-alias)
  - [StorybookConfigFramework (type alias)](#storybookconfigframework-type-alias)
  - [TypedComponent (type alias)](#typedcomponent-type-alias)
  - [TypedRenderer (interface)](#typedrenderer-interface)

---

# utils

## Decorator (type alias)

**Signature**

```ts
export type Decorator<TArgs = StrictArgs> = DecoratorFunction<TypedRenderer, TArgs>
```

Added in v1.0.0

## FrameworkOptions (type alias)

**Signature**

```ts
export type FrameworkOptions = {
  builder?: BuilderOptions
}
```

Added in v1.0.0

## Loader (type alias)

**Signature**

```ts
export type Loader<TArgs = StrictArgs> = LoaderFunction<TypedRenderer, TArgs>
```

Added in v1.0.0

## Meta (type alias)

**Signature**

```ts
export type Meta<Args> = {
  title?: string
  id?: string
  includeStories?: RegExp | Array<string>
  excludeStories?: RegExp | Array<string>
  tags?: Array<string>
  play?: PlayFunction<TypedRenderer, Args>
  decorators?:
    | Array<DecoratorFunction<TypedRenderer, Types.Simplify<Args>>>
    | DecoratorFunction<TypedRenderer, Types.Simplify<Args>>
  parameters?: Parameters
  argTypes?: Partial<ArgTypes<Args>>
  loaders?: Array<LoaderFunction<TypedRenderer, Args>> | LoaderFunction<TypedRenderer, Args>
  component: TypedComponent
  args?: Partial<Args>
}
```

Added in v1.0.0

## Preview (type alias)

**Signature**

```ts
export type Preview = ProjectAnnotations<TypedRenderer>
```

Added in v1.0.0

## RenderContext

**Signature**

```ts
export declare const RenderContext: RenderContext<TRenderer>
```

Added in v1.0.0

## StoryContext (type alias)

**Signature**

```ts
export type StoryContext<TArgs = StrictArgs> = GenericStoryContext<TypedRenderer, TArgs>
```

Added in v1.0.0

## StoryObj (type alias)

**Signature**

```ts
export type StoryObj<Args, T extends Meta<any> = never> = Types.Simplify<
  Omit<StoryAnnotations<TypedRenderer, Args, Omit<Args, keyof T["args"]>>, "render"> & {
    readonly render: (
      args: Args,
      ctx: Types.Simplify<StoryContext<typeof args> & { readonly component: T["component"] }>
    ) => TypedRenderer["storyResult"]
  }
>
```

Added in v1.0.0

## StorybookConfig (type alias)

**Signature**

```ts
export type StorybookConfig = Types.Simplify<
  Omit<StorybookConfigBase, keyof StorybookConfigVite | keyof StorybookConfigFramework> &
    StorybookConfigVite &
    StorybookConfigFramework
>
```

Added in v1.0.0

## StorybookConfigFramework (type alias)

**Signature**

```ts
export type StorybookConfigFramework = {
  framework:
    | FrameworkName
    | {
        name: FrameworkName
        options: FrameworkOptions
      }
  core?: StorybookConfigBase["core"] & {
    builder?:
      | BuilderName
      | {
          name: BuilderName
          options: BuilderOptions
        }
  }
}
```

Added in v1.0.0

## TypedComponent (type alias)

**Signature**

```ts
export type TypedComponent<Props = any, R = any, E = any> = (
  props: Props,
  ...children: ReadonlyArray<Renderable<CoreDomServices, E>>
) => Fx<R | CoreDomServices, E, RenderEvent>
```

Added in v1.0.0

## TypedRenderer (interface)

**Signature**

```ts
export interface TypedRenderer extends WebRenderer {
  component: TypedComponent
  storyResult: Fx<CoreDomServices, any, RenderEvent>
}
```

Added in v1.0.0
