import { html } from '../../src/HTML'

export const quux = ({ something }: { readonly something: string }) =>
  html`<div>Quux: ${something}</div>`
