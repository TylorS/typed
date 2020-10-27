import { Head } from 'List/Head'
import { Tail } from 'List/Tail'

// Convert directly to an intersection with recursive type
export type And<A extends ReadonlyArray<any>, Fallback = unknown> = AndLoop_<A, Fallback>

type AndLoop_<A extends ReadonlyArray<any>, End> = {
  continue: AndLoop_<Tail<A>, End & Head<A>>
  end: End
}[[] extends A ? 'end' : 'continue']
