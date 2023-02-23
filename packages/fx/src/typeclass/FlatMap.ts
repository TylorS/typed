import type * as F from '@effect/data/typeclass/FlatMap'

import { exhaustMap } from '../operator/exhaustMap.js'
import { flatMap } from '../operator/flatMap.js'
import { switchMap } from '../operator/switchMap.js'

import type { FxTypeLambda } from './TypeLambda.js'

export const FlatMap: F.FlatMap<FxTypeLambda> = {
  flatMap,
}

export const SwitchMap: F.FlatMap<FxTypeLambda> = {
  flatMap: switchMap,
}

export const ExhaustMap: F.FlatMap<FxTypeLambda> = {
  flatMap: exhaustMap,
}
