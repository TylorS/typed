import { Option } from '../Option'
import { Sync } from '../Sync'

export interface SyncOption<A> extends Sync<Option<A>> {}
