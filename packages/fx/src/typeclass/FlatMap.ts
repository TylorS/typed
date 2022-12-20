import * as F from '@fp-ts/core/typeclass/FlatMap'

import { exhaustMap } from '../operator/exhaustMap.js'
import { flatMap } from '../operator/flatMap.js'
import { switchMap } from '../operator/switchMap.js'

import { FxTypeLambda } from './TypeLambda.js'

export const FlatMap: F.FlatMap<FxTypeLambda> = {
  flatMap,
}

export const SwitchMap: F.FlatMap<FxTypeLambda> = {
  flatMap: switchMap,
}

export const ExhaustMap: F.FlatMap<FxTypeLambda> = {
  flatMap: exhaustMap,
}
