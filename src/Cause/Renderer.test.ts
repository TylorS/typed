import { deepStrictEqual } from 'assert'

import { Both, Disposed, Then, Unexpected } from './Cause'
import { prettyPrint } from './Renderer'

describe(__filename, () => {
  describe(prettyPrint.name, () => {
    describe('Unexpected', () => {
      it('renders the expected output', () => {
        const cause = Unexpected('uh-oh')
        const expected = '\nAn unexpected error has occurred.\n\nuh-oh'

        deepStrictEqual(prettyPrint(cause), expected)
      })
    })

    describe('Disposed', () => {
      it('renders the expected output', () => {
        deepStrictEqual(prettyPrint(Disposed), `\nDisposed.`)
      })
    })
    describe('Both', () => {
      it('renders the expected output', () => {
        const left = Unexpected('uh-oh')
        const right = Unexpected('uh-oh')
        const cause = Both(left, right)
        const expected =
          `
╥
╠══╦══╗
║  ║  ║
║  ║  ╠─An unexpected error has occurred.
║  ║  ║ ` + // Concatenation is being used to preserve spaces that are added. It's too difficult to fix and it doesn't matter once logged out
          `
║  ║  ║ uh-oh
║  ║  ▼
║  ║
║  ╠─An unexpected error has occurred.
║  ║ ` +
          `
║  ║ uh-oh
║  ▼
▼`

        deepStrictEqual(prettyPrint(cause), expected)
      })
    })
    describe('Then', () => {
      it('renders the expected output', () => {
        const left = Unexpected('uh-oh')
        const right = Unexpected('uh-oh')
        const cause = Then(left, right)
        const expected =
          `
╥
╠─An unexpected error has occurred.
║ ` +
          `
║ uh-oh
▼
║
╠─An unexpected error has occurred.
║ ` +
          `
║ uh-oh
▼`

        deepStrictEqual(prettyPrint(cause), expected)
      })
    })
  })
})
