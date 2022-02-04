import * as Fx from '@/Fx'
import * as Ref from '@/Ref'

export interface MutableQueue<A> extends Ref.Ref<unknown, never, A[]> {}

export const makeMutableQueue = <A>(): MutableQueue<A> => Ref.make(Fx.of<A[]>([]))
