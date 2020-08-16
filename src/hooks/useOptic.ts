import { Option } from 'fp-ts/es6/Option'
import { Iso, Lens, Optional, Prism } from 'monocle-ts'

import { Effect } from '../Effect'
import { HookEnv, UseState } from './HookEnvironment'
import { useIso } from './useIso'
import { useLens } from './useLens'
import { useOptional } from './useOptional'
import { usePrism } from './usePrism'

export function useOptic<A, B>(
  optic: Lens<A, B> | Iso<A, B>,
  useState: UseState<A>,
): Effect<HookEnv, UseState<B>>

export function useOptic<A, B>(
  optic: Optional<A, B> | Prism<A, B>,
  useState: UseState<A>,
): Effect<HookEnv, UseState<Option<B>>>

export function useOptic<A, B>(
  optic: Lens<A, B> | Iso<A, B> | Optional<A, B> | Prism<A, B>,
  useState: UseState<A>,
) {
  switch (optic._tag) {
    case 'Iso':
      return useIso(optic, useState)
    case 'Lens':
      return useLens(optic, useState)
    case 'Optional':
      return useOptional(optic, useState)
    case 'Prism':
      return usePrism(optic, useState)
  }
}
