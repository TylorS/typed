import { Functor2 } from '../Functor'
import { Pointed2 } from '../Pointed'
import { EitherHKT } from './Either'
import { map } from './map'
import { of } from './of'

export const Pointed: Pointed2<EitherHKT> = {
  of,
}

export const Functor: Functor2<EitherHKT> = {
  map,
}
