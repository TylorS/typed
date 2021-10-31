import { some } from 'fp-ts/Option'

import { make } from '@/MutableRef'
import * as Scheduler from '@/Scheduler'

import { Context } from './Context'
import { makeLocals } from './make'

export function fork(context: Context, inheritRefs: boolean = true): Context {
  return {
    scheduler: Scheduler.relative(context.scheduler),
    locals: inheritRefs ? context.locals.fork() : makeLocals(),
    renderer: context.renderer,
    parent: make(some(context)),
  }
}
