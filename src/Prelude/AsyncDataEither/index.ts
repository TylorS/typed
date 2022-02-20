import { Async } from '../Async'
import { DataEither } from '../DataEither'

export type AsyncDataEither<E, A> = Async<DataEither<E, A>>
