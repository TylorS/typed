**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/RenderRef"

# Module: "Patch/RenderRef"

## Index

### Variables

* [RenderRef](_patch_renderref_.md#renderref)

### Functions

* [getRenderRef](_patch_renderref_.md#getrenderref)

## Variables

### RenderRef

• `Const` **RenderRef**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<any>> = createShared( Symbol.for('RenderRef'), Pure.fromIO(() => createRef\<any>()),)

*Defined in [src/Patch/RenderRef.ts:10](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Patch/RenderRef.ts#L10)*

A Ref to the previously rendered value for a given Namespace.

## Functions

### getRenderRef

▸ `Const`**getRenderRef**\<A>(): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<A \| null \| undefined>>

*Defined in [src/Patch/RenderRef.ts:18](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Patch/RenderRef.ts#L18)*

Get a Ref that can be used to track the most-up-to-date Rendered value for a Namespace

#### Type parameters:

Name |
------ |
`A` |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<A \| null \| undefined>>
