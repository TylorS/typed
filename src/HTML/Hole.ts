import { Env } from '@tsplus/stdlib/service/Env'

import { Placeholder } from './Placeholder.js'
import type { Renderable } from './Renderable.js'

export class Hole implements Placeholder {
  readonly __Placeholder__!: {
    readonly _R: (_: never) => never
    readonly _E: (_: never) => never
  }

  constructor(
    readonly type: 'svg' | 'html',
    readonly env: Env<any>,
    readonly template: TemplateStringsArray,
    readonly values: Array<Renderable.Value<any>>,
  ) {}
}
