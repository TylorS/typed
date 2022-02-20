import { Sync } from '../Sync'
import { These } from '../These'

export interface SyncThese<E, A> extends Sync<These<E, A>> {}
