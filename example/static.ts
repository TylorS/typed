// import * as Effect from '@effect/io/Effect'
// import { renderStaticHtml, writeAllOutputs } from '@typed/framework/static'
// import * as indexHtml from 'html:./index'
// import * as otherHtml from 'html:./other'
// import * as other from 'runtime:./other-pages'
// import * as pages from 'runtime:./pages'
// import * as config from 'typed:config'

// const getParentElement = (doc: Document) => doc.getElementById('application')

// // Doesn't really matter unless you utilize this in your application directly
// const origin = 'https://example.com'

// const main = Effect.gen(function* ($) {
//   yield $(Effect.logInfo('Rendering static paths for pages...'))
//   const pageOutput = yield* $(renderStaticHtml(indexHtml, pages, getParentElement, origin))
//   yield $(Effect.logInfo('Rendering static paths for other-pages...'))
//   const otherOutput = yield* $(renderStaticHtml(otherHtml, other, getParentElement, origin))

//   yield $(Effect.logInfo('Writing static paths...'))
//   yield* $(writeAllOutputs(config.clientOutputDirectory, [...pageOutput, ...otherOutput]))
//   yield $(Effect.logInfo('Static paths written!'))
// })

// Effect.runPromise(main)
