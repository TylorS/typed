**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/fp-ts"

# Module: "Effect/fp-ts"

## Index

### Modules

* ["HKT"](_effect_fp_ts_._hkt_.md)

### Type aliases

* [URI](_effect_fp_ts_.md#uri)

### Variables

* [URI](_effect_fp_ts_.md#uri)

### Object literals

* [effect](_effect_fp_ts_.md#effect)
* [effectSeq](_effect_fp_ts_.md#effectseq)

## Type aliases

### URI

Ƭ  **URI**: *typeof* [URI](_effect_fp_ts_.md#uri)

*Defined in [src/Effect/fp-ts.ts:13](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/fp-ts.ts#L13)*

## Variables

### URI

• `Const` **URI**: \"@typed/fp/Effect\" = "@typed/fp/Effect"

*Defined in [src/Effect/fp-ts.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/fp-ts.ts#L11)*

## Object literals

### effect

▪ `Const` **effect**: object

*Defined in [src/Effect/fp-ts.ts:24](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/fp-ts.ts#L24)*

MonadTask + Alt instances for Effect with a parallel Applicative instance.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@typed/fp/Effect\" | \"@typed/fp/Effect\" |
`ap` | function | \<E1, A, B, E2>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>, value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B>\<E1, A, B>(fn: [Effect](_effect_effect_.effect.md)\<E1, [Arity1](_common_types_.md#arity1)\<A, B>>) => \<E2>(value: [Effect](_effect_effect_.effect.md)\<E2, A>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, B> |
`fromIO` | fromIO | Effect.fromIO |
`fromTask` | [fromTask](_effect_fromtask_.md#fromtask) | fromTask |
`of` | of | Effect.of |
`alt` | function | (fa: [Effect](_effect_effect_.effect.md)\<E, A>, f: Lazy\<[Effect](_effect_effect_.effect.md)\<E, A>>) => [Effect](_effect_effect_.effect.md)\<E, A> |
`chain` | function | (fa: [Effect](_effect_effect_.effect.md)\<E, A>, f: (a: A) => Kind2\<F, E, B>) => [Effect](_effect_effect_.effect.md)\<E, B> |
`map` | function | (fa: [Effect](_effect_effect_.effect.md)\<E, A>, f: (a: A) => B) => [Effect](_effect_effect_.effect.md)\<E, B> |

___

### effectSeq

▪ `Const` **effectSeq**: object

*Defined in [src/Effect/fp-ts.ts:38](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/fp-ts.ts#L38)*

MonadTask + Alt instances for Effect with a sequential Applicative instance.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`ap` | function | apSeq |
