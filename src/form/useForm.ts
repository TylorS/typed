import { And } from '@typed/fp/common/And'
import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useCallback, useMemo, useState } from '@typed/fp/hooks/exports'
import { eqBoolean } from 'fp-ts/Eq'

import {
  FieldKeyOf,
  FieldState,
  FieldValue,
  getFieldIsDirty,
  getFieldIsPristine,
  getFieldKey,
  getFieldState,
} from './FieldState'
import { FormState, FormStateData } from './FormState'
import { ownKeys } from './reflection'

export function useForm<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>>(
  ...fields: Fields
): Effect<HookOpEnvs, UseForm<Fields>> {
  type S = FormStateOf<Fields>

  const eff = doEffect(function* () {
    const obj = yield* useMemo(
      (fs) => Object.fromEntries(fs.map((s) => [getFieldKey(s), s])) as FormStateObj<Fields>,
      [fields],
    )
    const state = yield* useMemo(
      (fs) => Object.fromEntries(fs.map((f) => [getFieldKey(f), getFieldState(f)])) as S,
      [fields],
    )

    const [getHasBeenSubmitted, updateHasBeenSubmitted] = yield* useState(Pure.of(false), eqBoolean)

    const formData = yield* useMemo(
      (fs, hasBeenSubmitted): FormStateData => ({
        isPristine: fs.every(getFieldIsPristine),
        isDirty: fs.some(getFieldIsDirty),
        hasBeenSubmitted,
      }),
      [fields, yield* getHasBeenSubmitted] as const,
    )

    const updateState = yield* useCallback(
      (update: Arity1<S, S>): Pure<S> =>
        doEffect(function* () {
          const updated = update(state)
          const keys = ownKeys(updated as any) as Array<keyof S>

          for (const key of keys) {
            const [, setState, { eq }] = Reflect.get(obj as object, key) as FieldState<
              typeof key,
              S[typeof key]
            >
            const a = Reflect.get(state as object, key)
            const b = Reflect.get(updated as object, key)

            if (!eq.equals(a, b)) {
              yield* setState(() => b)
            }
          }

          return updated
        }),
      [state],
    )

    return [state, updateState, formData, { updateHasBeenSubmitted }] as const
  })

  return eff
}

export type UseForm<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = FormState<
  FormStateOf<Fields>
>

export type FormStateOf<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = Readonly<
  And<
    {
      [K in keyof Fields]: FieldKeyOf<Fields[K]> extends PropertyKey
        ? { [Key in FieldKeyOf<Fields[K]>]: FieldValue<Fields[K]> }
        : never
    }
  >
>

type FormStateObj<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = And<
  {
    [K in keyof Fields]: FieldKeyOf<Fields[K]> extends PropertyKey
      ? { [Key in FieldKeyOf<Fields[K]>]: Fields[K] }
      : never
  }
>
