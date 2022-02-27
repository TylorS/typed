import * as App from '../Applicative'
import * as Ap from '../Apply'
import { AssociativeBoth2 } from '../AssociativeBoth'
import { Covariant2 } from '../Covariant'
import { pipe } from '../function'
import { Pointed2 } from '../Pointed'
import { EitherHKT, Left, Right } from './Either'
import { map } from './map'
import { match } from './match'
import { of } from './of'

export const Pointed: Pointed2<EitherHKT> = {
  of,
}

export const Covariant: Covariant2<EitherHKT> = {
  map,
}

export const AssociativeBoth: AssociativeBoth2<EitherHKT> = {
  both: (second) => (first) =>
    pipe(
      first,
      match(Left, (a) =>
        pipe(
          second,
          match(Left, (b) => Right([a, b] as const)),
        ),
      ),
    ),
}

export const Apply: Ap.Apply2<EitherHKT> = {
  ...Covariant,
  ...AssociativeBoth,
}

export const Applicative: App.Applicative2<EitherHKT> = {
  ...Apply,
  ...Pointed,
}
