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
import type { CoreDomServices } from "@typed/core"
import type { Fx } from "@typed/fx/Fx"
import type { Renderable, RenderEvent } from "@typed/template"
import type { Types } from "effect"

type FrameworkName = "@storybook/typed"
type BuilderName = "@storybook/builder-vite"

export type FrameworkOptions = {
  builder?: BuilderOptions
}

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
export type StorybookConfig = Types.Simplify<
  & Omit<
    StorybookConfigBase,
    keyof StorybookConfigVite | keyof StorybookConfigFramework
  >
  & StorybookConfigVite
  & StorybookConfigFramework
>

export interface TypedRenderer extends WebRenderer {
  component: TypedComponent
  storyResult: Fx<CoreDomServices, any, RenderEvent>
}

export type { RenderContext } from "@storybook/types"

export type TypedComponent<Props = any, R = any, E = any> = (
  props: Props,
  ...children: ReadonlyArray<Renderable<CoreDomServices, E>>
) => Fx<R | CoreDomServices, E, RenderEvent>

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
    readonly render: (
      args: Args,
      ctx: Types.Simplify<StoryContext<typeof args> & { readonly component: T["component"] }>
    ) => TypedRenderer["storyResult"]
  }
>

export type Decorator<TArgs = StrictArgs> = DecoratorFunction<TypedRenderer, TArgs>
export type Loader<TArgs = StrictArgs> = LoaderFunction<TypedRenderer, TArgs>
export type StoryContext<TArgs = StrictArgs> = GenericStoryContext<TypedRenderer, TArgs>
export type Preview = ProjectAnnotations<TypedRenderer>
