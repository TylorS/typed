export * from './dom.js'
export * from './ElementRef.js'
export * from './EventHandler.js'
export * from './Placeholder.js'
export * from './render.js'
export * from './Renderable.js'
export * from './RenderCache.js'
export * from './RenderContext.js'
export * from './RenderTemplate.js'
export * from './TemplateCache.js'
export * from './whenBrowser.js'
export * from '@typed/wire'

/// <reference path="./udomdiff.d.ts" />
/// <reference path="./uparser.d.ts" />

// TODO: RenderTemplate needs to return a sequence of RenderEvents.
//   - Should return an ordered list of RenderEvents
//   - RenderEvents should be able to be used to batch updates.
//   - RenderEvents should be able to be used to construct HTML
//   - Ideally, RenderEvents can help with hydration
