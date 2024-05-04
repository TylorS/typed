/**
 * Storybook types for Typed projects.
 * @since 1.0.0
 */

import type { BuilderOptions, StorybookConfigVite } from "@storybook/builder-vite"
import type {
  ArgTypes,
  DecoratorFunction,
  LoaderFunction,
  Parameters,
  PlayFunction,
  ProjectAnnotations,
  StoryAnnotations,
  StorybookConfig as StorybookConfigBase,
  StoryContext as GenericStoryContext,
  StrictArgs,
  WebRenderer
} from "@storybook/types"
import type { CoreDomServices } from "@typed/core/CoreServices"
import type { Fx } from "@typed/fx/Fx"
import type { Renderable, RenderEvent } from "@typed/template"
import type * as Types from "effect/Types"

type FrameworkName = "@storybook/typed"
type BuilderName = "@storybook/builder-vite"

/**
 * @since 1.0.0
 */
export type FrameworkOptions = {
  builder?: BuilderOptions
}

/**
 * @since 1.0.0
 */
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

/**
 * The interface for Storybook configuration in `main.ts` files.
 */

/**
 * @since 1.0.0
 */
export type StorybookConfig = Types.Simplify<
  & Omit<
    StorybookConfigBase,
    keyof StorybookConfigVite | keyof StorybookConfigFramework
  >
  & StorybookConfigVite
  & StorybookConfigFramework
>

/**
 * @since 1.0.0
 */
export interface TypedRenderer extends WebRenderer {
  component: TypedComponent
  storyResult: Fx<RenderEvent, any, CoreDomServices>
}

export type {
  /**
   * @since 1.0.0
   */
  RenderContext
} from "@storybook/types"

/**
 * @since 1.0.0
 */
export type TypedComponent<Props = any, R = any, E = any> = (
  props: Props,
  ...children: ReadonlyArray<Renderable<CoreDomServices, E>>
) => Fx<RenderEvent, E, R | CoreDomServices>

/**
 * @since 1.0.0
 */
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

/**
 * @since 1.0.0
 */
export type StoryObj<Args, T extends Meta<any> = never> = Types.Simplify<
  & Omit<
    StoryAnnotations<
      TypedRenderer,
      Args,
      Omit<Args, keyof T["args"]>
    >,
    "render"
  >
  & {
    render: (
      args: Args,
      ctx: Types.Simplify<StoryContext<typeof args> & { readonly component: T["component"] }>
    ) => TypedRenderer["storyResult"]
  }
>

/**
 * @since 1.0.0
 */
export type Decorator<TArgs = StrictArgs> = DecoratorFunction<TypedRenderer, TArgs>

/**
 * @since 1.0.0
 */
export type Loader<TArgs = StrictArgs> = LoaderFunction<TypedRenderer, TArgs>

/**
 * @since 1.0.0
 */
export type StoryContext<TArgs = StrictArgs> = GenericStoryContext<TypedRenderer, TArgs>

/**
 * @since 1.0.0
 */
export type Preview = ProjectAnnotations<TypedRenderer>
