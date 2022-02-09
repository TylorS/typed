import * as Exit from '@/Exit'
import { FiberId } from '@/FiberId'
import { Either } from '@/Prelude/Either'

import { instr } from './Instruction'

export class FromExit<E, A> extends instr('FromExit')<Exit.Exit<E, A>, unknown, E, A> {}

export const fromExit = <E, A>(exit: Exit.Exit<E, A>, trace = 'fromExit') =>
  new FromExit(exit, trace)

export const of = <A, E = never>(a: A, trace = 'of') => fromExit<E, A>(Exit.success(a), trace)

export const fail = <E, A = never>(error: E, trace = 'fail') =>
  fromExit<E, A>(Exit.fail(error), trace)

export const disposed = <E = never, A = never>(id: FiberId, trace = 'disposed') =>
  fromExit<E, A>(Exit.disposed(id), trace)

export const fromEither = <E, A>(either: Either<E, A>, trace = 'fromEither') =>
  fromExit<E, A>(Exit.fromEither(either), trace)

export const unexpected = <E = never, A = never>(error: unknown, trace = 'unexpected') =>
  fromExit<E, A>(Exit.unexpected(error), trace)
