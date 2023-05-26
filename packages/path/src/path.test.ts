import { deepStrictEqual } from 'assert'

import { assertType, describe, it } from 'vitest'

import { pathJoin } from './index.js'

describe(import.meta.url, () => {
  describe(pathJoin.name, () => {
    it('joins standard paths', () => {
      deepStrictEqual(pathJoin('a', 'b', 'c'), '/a/b/c')
      deepStrictEqual(pathJoin('a', '/b', 'c'), '/a/b/c')
      deepStrictEqual(pathJoin('a', '/b', '/c'), '/a/b/c')
      deepStrictEqual(pathJoin('/a', '/b', '/c'), '/a/b/c')
    })

    it('joins parameterized paths', () => {
      deepStrictEqual(pathJoin('a', ':b', 'c'), '/a/:b/c')
      deepStrictEqual(pathJoin('a', ':b', ':c'), '/a/:b/:c')
      deepStrictEqual(pathJoin(':a', ':b', ':c'), '/:a/:b/:c')
      deepStrictEqual(pathJoin('a', ':b', '/c'), '/a/:b/c')
      deepStrictEqual(pathJoin('a', '/:b', 'c'), '/a/:b/c')
      deepStrictEqual(pathJoin('a', '/:b', '/c'), '/a/:b/c')
      deepStrictEqual(pathJoin('/a', '/:b', '/c'), '/a/:b/c')
    })

    it('removes empty paths', () => {
      deepStrictEqual(pathJoin('a', '', 'c'), '/a/c')
    })

    it('removes trailing slashes', () => {
      deepStrictEqual(pathJoin('a', 'b', 'c/'), '/a/b/c')
      deepStrictEqual(pathJoin('a', 'b/', 'c'), '/a/b/c')
      deepStrictEqual(pathJoin('a/', 'b', 'c'), '/a/b/c')
      deepStrictEqual(pathJoin('a/', 'b/', 'c'), '/a/b/c')
      deepStrictEqual(pathJoin('a/', 'b////', 'c/'), '/a/b/c')
    })

    describe('type-level', () => {
      it('joins paths', () => {
        assertType<'/a/b/c'>(pathJoin('a', 'b', 'c'))
        assertType<'/a/b/c'>(pathJoin('a', '/b', 'c'))
        assertType<'/a/b/c'>(pathJoin('a', '/b', '/c'))
        assertType<'/a/b/c'>(pathJoin('/a', '/b', '/c'))

        assertType<'/a/:b/c'>(pathJoin('a', ':b', 'c'))
        assertType<'/a/:b/:c'>(pathJoin('a', ':b', ':c'))
        assertType<'/:a/:b/:c'>(pathJoin(':a', ':b', ':c'))
        assertType<'/a/:b/c'>(pathJoin('a', ':b', '/c'))
        assertType<'/a/:b/c'>(pathJoin('a', '/:b', 'c'))
        assertType<'/a/:b/c'>(pathJoin('a', '/:b', '/c'))
        assertType<'/a/:b/c'>(pathJoin('/a', '/:b', '/c'))

        assertType<'/a/c'>(pathJoin('a', '', 'c'))

        assertType<'/a/b/c'>(pathJoin('a', 'b', 'c/'))
        assertType<'/a/b/c'>(pathJoin('a', 'b///', 'c'))
      })
    })
  })
})
