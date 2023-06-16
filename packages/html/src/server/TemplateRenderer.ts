import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { Renderable } from '../Renderable.js'
import { TemplateResult } from '../TemplateResult.js'
import { hashForTemplateStrings } from '../hashForTemplateStrings.js'
import { Token, tokenizeTemplateStrings } from '../tokenizer/tokenizer.js'
import { defaultTokenToHtmlState, tokensToHtml } from '../tokensToHtml.js'

import { Part } from './part/Part.js'
import { AttrPart } from './part/AttrPart.js'

type ServerTemplateCache = {
  readonly tokens: readonly Token[]
  readonly hash: string
}

function renderTemplateResult(
  document: Document,
  context: RenderContext,
  result: TemplateResult,
  templateIndex: number,
): Fx.Fx<never, never, string> {
  const cache = getTemplateCache(result, context)

  if (result.values.length === 0) {
    const { html } = tokensToHtml(cache.tokens, templateIndex, cache.hash)

    return Fx.succeed(html)
  }

  // eslint-disable-next-line require-yield
  return Fx.Fx<never, never, string>((sink) =>
    Effect.gen(function* ($) {
      const parts = tokensToParts(cache.tokens, result.values)

      yield* $(sink.event(html))
    }),
  )
}

function tokensToParts(tokens: readonly Token[], values: TemplateResult['values']) {
  const parts: Array<[Part, Renderable<any, any>]> = []
  const partToHtml = new Map<Part, string>()

  let context: 'attr' | 'boolean' | 'class' | 'data' | 'event' | 'node' | 'ref' | 'text' = 'node'

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i]

    switch (token._tag) {
      case 'attribute-start': {
        context = 'attr'
        break
      }
      case 'boolean-attribute-start': {
        context = 'boolean'
        break
      }
      case 'part-token': {
        if (!context) throw Error(`Bad template`)

        switch (context) {
          case 'attr': {
            const part = AttrPart.
          }
        }
      }
    }
  }

  return parts
}

function getTemplateCache(result: TemplateResult, context: RenderContext): ServerTemplateCache {
  const existing = context.templateCache.get(result.template)

  if (existing) return existing as ServerTemplateCache

  const cache = makeTemplateCache(result)

  context.templateCache.set(result.template, cache)

  return cache
}

function makeTemplateCache(result: TemplateResult): ServerTemplateCache {
  const tokens = tokenizeTemplateStrings(result.template)
  const hash = hashForTemplateStrings(result.template)
  const cache: ServerTemplateCache = {
    tokens,
    hash,
  }

  return cache
}
