import { None } from '../None'
import { Pending } from '../Pending'
import { Refreshing } from '../Refreshing'
import { Some } from '../Some'

export type Data<A> = None | Pending | Refreshing<A> | Some<A>
