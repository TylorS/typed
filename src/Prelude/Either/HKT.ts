import { Covariant2 } from '../Covariant'
import { Pointed2 } from '../Pointed'
import { EitherHKT } from './Either'
import { map } from './map'
import { of } from './of'

export const Pointed: Pointed2<EitherHKT> = {
  of,
}

export const Covariant: Covariant2<EitherHKT> = {
  map,
}
