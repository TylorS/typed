import { Context } from '@fp-ts/data/Context'

import { Placeholder } from './Placeholder.js'

export class Hole implements Placeholder {
  readonly __Placeholder__!: {
    readonly _R: (_: never) => never
    readonly _E: (_: never) => never
  }

  constructor(
    readonly type: 'svg' | 'html',
    readonly context: Context<any>,
    readonly template: TemplateStringsArray,
    readonly values: Array<any>,
  ) {}
}
