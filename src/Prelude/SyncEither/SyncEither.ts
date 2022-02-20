import { Either } from '../Either'
import { Sync } from '../Sync'

export interface SyncEither<E, A> extends Sync<Either<E, A>> {}
