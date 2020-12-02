**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useRef"

# Module: "Shared/hooks/useRef"

## Index

### Functions

* [useRef](_shared_hooks_useref_.md#useref)

## Functions

### useRef

▸ `Const`**useRef**\<E, A>(`initial`: [Effect](_effect_effect_.effect.md)\<E, A>, `eq?`: Eq\<A>): [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<A>>

*Defined in [src/Shared/hooks/useRef.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/hooks/useRef.ts#L12)*

Create a shared reference

**`hook`** 

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`initial` | [Effect](_effect_effect_.effect.md)\<E, A> | - |
`eq` | Eq\<A> | eqStrict |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<A>>
