// For support of our virtual modules
/// <reference types="@typed/framework" />

import * as Effect from '@effect/io/Effect'
import { renderStaticHtml, writeAllOutputs } from '@typed/framework/static'
import * as indexHtml from 'html:./index'
import * as otherHtml from 'html:./other'
import * as other from 'runtime:./other-pages'
import * as pages from 'runtime:./pages'
import * as config from 'typed:config'

const getParentElement = (doc: Document) => doc.getElementById('application')

// Doesn't really matter unless you utilize this in your application directly
const origin = 'https://example.com'

const main = Effect.gen(function* ($) {
  console.log('Rendering static paths for pages...')
  const pageOutput = yield* $(renderStaticHtml(indexHtml, pages, getParentElement, origin))
  console.log('Rendering static paths for other-pages...')
  const otherOutput = yield* $(renderStaticHtml(otherHtml, other, getParentElement, origin))

  console.log('Writing static paths...')
  yield* $(writeAllOutputs(config.clientOutputDirectory, [...pageOutput, ...otherOutput]))
  console.log('Static paths written!')
})

Effect.unsafeRunPromise(main)
