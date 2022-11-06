import { Env } from '@tsplus/stdlib/service/Env'

import { Placeholder } from './Placeholder.js'

export class Hole implements Placeholder {
  readonly _R!: (_: never) => never

  constructor(
    readonly type: 'svg' | 'html',
    readonly env: Env<any>,
    readonly template: TemplateStringsArray,
    readonly values: Array<Placeholder<any>>,
  ) {}
}
