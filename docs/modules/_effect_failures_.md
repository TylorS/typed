**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/failures"

# Module: "Effect/failures"

## Index

### Type aliases

* [FailEnv](_effect_failures_.md#failenv)

### Variables

* [attempt](_effect_failures_.md#attempt)
* [catchError](_effect_failures_.md#catcherror)
* [fail](_effect_failures_.md#fail)

## Type aliases

### FailEnv

Ƭ  **FailEnv**\<K, Err>: Record\<K, (err: Err) => [Resume](_resume_resume_.md#resume)\<never>>

*Defined in [src/Effect/failures.ts:14](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/failures.ts#L14)*

An environment to represent type-safe errors.

#### Type parameters:

Name | Type |
------ | ------ |
`K` | PropertyKey |
`Err` | - |

## Variables

### attempt

• `Const` **attempt**: \<K, E, A>(key: K, eff: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<O.Exclude\<E, [FailEnv](_effect_failures_.md#failenv)\<K, any>>, Either\<[HeadArg](_common_types_.md#headarg)\<E[K]>, A>>\<K>(key: K) => \<E, A>(eff: [Effect](_effect_effect_.effect.md)\<E, A>) => [Effect](_effect_effect_.effect.md)\<O.Exclude\<E, [FailEnv](_effect_failures_.md#failenv)\<K, any>>, Either\<[HeadArg](_common_types_.md#headarg)\<E[K]>, A>> = curry( \<K extends PropertyKey, E extends FailEnv\<K, never>, A>( key: K, eff: Effect\<E, A>, ): Effect\<O.Exclude\<E, FailEnv\<K, any>>, Either\<HeadArg\<E[K]>, A>> => catchError(key, left, map(right, eff)) as any,) as { \<K extends PropertyKey, E extends FailEnv\<K, never>, A>(key: K, eff: Effect\<E, A>): Effect\< O.Exclude\<E, FailEnv\<K, any>>, Either\<HeadArg\<E[K]>, A> > \<K extends PropertyKey>(key: K): \<E extends FailEnv\<K, never>, A>( eff: Effect\<E, A>, ) => Effect\<O.Exclude\<E, FailEnv\<K, any>>, Either\<HeadArg\<E[K]>, A>>}

*Defined in [src/Effect/failures.ts:70](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/failures.ts#L70)*

Attempt an Effect that can fail catching the error into an Either.

___

### catchError

• `Const` **catchError**: \<K, Err, A, E>(key: K, onError: (error: Err) => A, effect: [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, Err>, A>) => [Effect](_effect_effect_.effect.md)\<{}, A>\<K, Err, A>(key: K, onError: (error: Err) => A) => \<E>(effect: [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, Err>, A>) => [Effect](_effect_effect_.effect.md)\<E, A>\<K>(key: K) => \<Err, A, E>(onError: (error: Err) => A, effect: [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, Err>, A>) => [Effect](_effect_effect_.effect.md)\<E, A>\<Err, A>(onError: (error: Err) => A) => \<E>(effect: [Effect](_effect_effect_.effect.md)\<E & [FailEnv](_effect_failures_.md#failenv)\<K, Err>, A>) => [Effect](_effect_effect_.effect.md)\<E, A> = curry( \<K extends PropertyKey, Err, E, A>( key: K, onError: (error: Err) => A, effect: Effect\<E & FailEnv\<K, Err>, A>, ): Effect\<E, A> => fromEnv((e: E) => async((returnToOuterContext) => { // FailEnv implementation which uses continuations to bail out to the outer context const failEnv = { [key]: (err: Err) => async(() => returnToOuterContext(onError(err))), } as FailEnv\<K, Err> const env = toEnv(effect) return run(env({ ...e, ...failEnv }), returnToOuterContext) }), ) as Effect\<E, A>,) as { \<K extends PropertyKey, Err, A, E>( key: K, onError: (error: Err) => A, effect: Effect\<E & FailEnv\<K, Err>, A>, ): Effect\<{ [EK in keyof E as EK extends K ? never : EK]: E[EK] }, A> \<K extends PropertyKey, Err, A>(key: K, onError: (error: Err) => A): \<E>( effect: Effect\<E & FailEnv\<K, Err>, A>, ) => Effect\<E, A> \<K extends PropertyKey>(key: K): { \<Err, A, E>(onError: (error: Err) => A, effect: Effect\<E & FailEnv\<K, Err>, A>): Effect\<E, A> \<Err, A>(onError: (error: Err) => A): \<E>( effect: Effect\<E & FailEnv\<K, Err>, A>, ) => Effect\<E, A> }}

*Defined in [src/Effect/failures.ts:30](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/failures.ts#L30)*

Catch a keyed error using continuations.

___

### fail

• `Const` **fail**: \<K, Err>(key: K, error: Err) => [Effect](_effect_effect_.effect.md)\<[FailEnv](_effect_failures_.md#failenv)\<K, Err>, never>\<K>(key: K) => \<Err>(error: Err) => [Effect](_effect_effect_.effect.md)\<[FailEnv](_effect_failures_.md#failenv)\<K, Err>, never> = curry( \<K extends PropertyKey, Err>(key: K, error: Err): Effect\<FailEnv\<K, Err>, never> => fromEnv((e) => e[key](error)),) as { \<K extends PropertyKey, Err>(key: K, error: Err): Effect\<FailEnv\<K, Err>, never> \<K extends PropertyKey>(key: K): \<Err>(error: Err) => Effect\<FailEnv\<K, Err>, never>}

*Defined in [src/Effect/failures.ts:19](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Effect/failures.ts#L19)*

Place the requirement to satisfy a potential failure from the environment at the provided key.
