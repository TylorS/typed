import { describe, it, expect } from 'vitest'

import { removeAttribute } from './templateHelpers.js'

describe(import.meta.url, () => {
  describe(removeAttribute.name, () => {
    it('removes an attribute with or without quotations', () => {
      for (const [parts, name] of [
        [['<div ', 'class='], 'class'],
        [['<div ', 'onclick='], 'onclick'],
        [['<div ', '@click='], '@click'],
      ] as const) {
        expect(removeAttribute(name, parts.join(''))).toBe('<div ')
        expect(removeAttribute(name, parts.join('') + `"`)).toBe('<div ')
        expect(removeAttribute(name, parts.join('') + `'`)).toBe('<div ')
      }
    })
  })
})
