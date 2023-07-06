import { Tag } from '@effect/data/Context'

import { Handler } from './Handler.js'
import { Lambda } from './Lambda.js'

export interface Operation<in out R, in out E, in out Input extends Lambda>
  extends Operation.Variance<R, E, Input> {
  readonly id: string
  readonly key: Tag<R, Handler<any, any, any>>
}

export function Operation<Input extends Lambda>(id: string) {
  const key = Tag<any>(id)

  return class OperationImpl<R, E>
    extends Operation.Variance<R, E, Input>
    implements Operation<R, E, Input>
  {
    readonly id = id
    readonly key = key as Operation<R, E, Input>['key']
  }
}

export namespace Operation {
  export abstract class Variance<R, E, Input extends Lambda> {
    readonly _R!: (_: never) => R
    readonly _E!: (_: never) => E
    readonly _A!: (_: never) => Input
  }
}
