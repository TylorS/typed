/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="vite/client" />
/// <reference path="./vavite.d.ts" />
/// <reference path="./virtual-modules.d.ts" />
/* eslint-enable @typescript-eslint/triple-slash-reference */

export type { BrowserModule } from './BrowserModule.js'
export * from './buildModules.js'
export { type Fallback, RedirectFallback, RenderableFallback } from './FallbackModule.js'
export * from './fileNames.js'
export type { HtmlModule } from './HtmlModule.js'
export type { IntrinsicServices } from './IntrinsicServices.js'
export * from './Module.js'
export * from './provideIntrinsics.js'
export * from './runMatcherWithFallback.js'
export type { RuntimeModule } from './RuntimeModule.js'
