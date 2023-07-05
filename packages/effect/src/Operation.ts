import { Tag } from '@effect/data/Context'

import { Handler } from './Handler.js'
import { Lambda } from './Lambda.js'

export interface Operation<in out R, in out E, in out Input extends Lambda> {
  readonly _R: (_: never) => R
  readonly _E: (_: never) => E
  readonly _A: (_: Input) => never

  readonly _tag: 'Op'
  readonly id: string
  readonly key: Tag<R, Handler<any, any, any>>
}
