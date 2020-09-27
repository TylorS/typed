import { And } from '@typed/fp/common/And'
import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure, zipObj } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useCallback, useMemo, UseState } from '@typed/fp/hooks/exports'

import { FieldKeyOf, FieldState, FieldValue, getFieldKey } from './FieldState'
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
    const getState = yield* useMemo(
      (fs) =>
        zipObj(
          Object.fromEntries(fs.map(([getField, , fieldData]) => [fieldData.key, getField])),
        ) as Pure<S>,
      [fields],
    )

    const updateState = yield* useCallback(
      (update: Arity1<S, S>): Pure<S> =>
        doEffect(function* () {
          const current = yield* getState
          const updated = update(current)
          const keys = ownKeys(updated as any) as Array<keyof S>

          for (const key of keys) {
            const [, setState, { eq }] = Reflect.get(obj as object, key) as FieldState<
              typeof key,
              S[typeof key]
            >
            const a = Reflect.get(current as object, key)
            const b = Reflect.get(updated as object, key)

            if (!eq.equals(a, b)) {
              yield* setState(() => b)
            }
          }

          return updated
        }),
      [],
    )

    return [getState, updateState] as const
  })

  return eff
}

export type UseForm<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = UseState<
  FormStateOf<Fields>
>

export type FormStateOf<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = And<
  {
    [K in keyof Fields]: FieldKeyOf<Fields[K]> extends PropertyKey
      ? { [Key in FieldKeyOf<Fields[K]>]: FieldValue<Fields[K]> }
      : never
  }
>

type FormStateObj<Fields extends ReadonlyArray<FieldState<PropertyKey, any>>> = And<
  {
    [K in keyof Fields]: FieldKeyOf<Fields[K]> extends PropertyKey
      ? { [Key in FieldKeyOf<Fields[K]>]: Fields[K] }
      : never
  }
>
