/**
 * @since 1.0.0
 */

import { html } from "@typed/template/RenderTemplate"
import type { Component } from "./Component.js"
import type { HTMLAnchorElementProperties } from "./dom-properties.js"
import type { TypedProps } from "./Props.js"

/**
 * @since 1.0.0
 */
export type AnchorProps = TypedProps<HTMLAnchorElementProperties, HTMLAnchorElement>

/**
 * @since 1.0.0
 */
export const Anchor: Component<AnchorProps> = (props, ...children) => html`<a ...${props}>${children}</a>`
