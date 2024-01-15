/**
 * @since 1.0.0
 */

import type { Fx } from "@typed/fx/Fx"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import type { Scope } from "effect"

/**
 * @since 1.0.0
 */
export interface Component<Props, R = never, E = never> {
  <P extends Props, Children extends ReadonlyArray<Renderable<any, any>>>(
    props: P,
    ...children: Children
  ): Fx<
    R | Scope.Scope | RenderTemplate | Placeholder.Context<P[keyof P] | Children[number]>,
    E | Placeholder.Error<P[keyof P] | Children[number]>,
    RenderEvent
  >
}
