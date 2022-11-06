import { Env } from '@tsplus/stdlib/service/Env'

import { Placeholder } from './Placeholder.js'

export class Hole<R = never> implements Placeholder<R> {
  readonly _R!: (_: never) => R

  constructor(
    readonly type: 'svg' | 'html',
    readonly env: Env<R>,
    readonly template: TemplateStringsArray,
    readonly values: Array<Placeholder<R>>,
  ) {}
}
