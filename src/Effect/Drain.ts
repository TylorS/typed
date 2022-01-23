import { Disposable } from '@/Disposable'
import { Stream } from '@/Stream'

import { instr } from './Instruction'

export class Drain<R, E, A> extends instr('Drain')<Stream<R, E, A>, R, E, Disposable> {}

export const drain = <R, E, A>(stream: Stream<R, E, A>, trace?: string) => new Drain(stream, trace)
