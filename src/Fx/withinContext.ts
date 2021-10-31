import { pipe } from 'fp-ts/function'

import { Context } from '@/Context'
import { handle } from '@/Effect'

import { Fx } from './Fx'

export function withinContext(context: Context) {
  return <R, A>(fx: Fx<R, A>): Fx<R, A> =>
    pipe(
      fx,
      handle(function* (i) {
        if (i.type === 'GetContext') {
          return context
        }

        return yield i
      }),
    )
}
