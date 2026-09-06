import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { html, type Renderable, type RenderTemplate } from "@typed/template";
import type { Args, ArgTypes, StoryObj } from "@storybook/html-vite";
import * as Storybook from "../src/Storybook.js";

export type StoryContent<A extends Renderable.Any, E, R> = Fx.Fx<A, E, R> | (() => Fx.Fx<A, E, R>);

export type StoryComponent<Props, A extends Renderable.Any, E, R> = (
  props: Props,
) => Fx.Fx<A, E, R>;

/** Creates an isolated, long-lived Storybook story for a Typed template. */
export function story<A extends Renderable.Any, E, R extends Scope.Scope | RenderTemplate>(
  content: StoryContent<A, E, R>,
): StoryObj;
export function story<
  Props extends object,
  A extends Renderable.Any,
  E,
  R extends Scope.Scope | RenderTemplate,
>(
  content: StoryComponent<Props, A, E, R>,
  args: NoInfer<Props>,
  argTypes?: Partial<ArgTypes<Props>>,
): StoryObj<Props>;
export function story(
  content: Fx.Fx<any, any, any> | ((...args: Array<any>) => Fx.Fx<any, any, any>),
  initialArgs?: Args,
  argTypes?: Partial<ArgTypes>,
): StoryObj<any> {
  let mounted: Storybook.MountedStory | undefined;

  const definition = {
    loaders: [
      async ({ args }: { readonly args: Args }) => {
        if (mounted !== undefined) await mounted.dispose();
        const rendered = Fx.isFx(content) ? content : content(args);
        mounted = await Storybook.mount(html`<div class="typed-story-content">${rendered}</div>`);
        mounted.canvas.className = "typed-story";
        return {};
      },
    ],
    render: () => {
      if (mounted === undefined) throw new Error("Story rendered before mounting.");
      return mounted.canvas;
    },
  };

  return initialArgs === undefined
    ? definition
    : {
        ...definition,
        args: initialArgs,
        ...(argTypes === undefined ? {} : { argTypes }),
      };
}
