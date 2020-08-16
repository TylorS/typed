import { Iso } from 'monocle-ts/es6/Iso'
import { Lens } from 'monocle-ts/es6/Lens'
import { Optional } from 'monocle-ts/es6/Optional'
import { Prism } from 'monocle-ts/es6/Prism'

export type Optic<A, B> = Lens<A, B> | Iso<A, B> | Optional<A, B> | Prism<A, B>
