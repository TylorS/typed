import { html } from './RenderTemplate.js'
import { HTMLDivElementProperties } from './generic-property-types.js'
import { AnyChildren } from './tag.js'

export function div<P extends HTMLDivElementProperties, C extends AnyChildren>(
  props: P,
  children: C,
) {
  return html`<div class=${props.className} id=${props.id} accesskey=${props.accesskey} >
    ${children}
  </div>`
}
