**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/Renderer"

# Module: "Patch/Renderer"

## Index

### Variables

* [Renderer](_patch_renderer_.md#renderer)

### Functions

* [getRenderer](_patch_renderer_.md#getrenderer)
* [setRenderer](_patch_renderer_.md#setrenderer)

## Variables

### Renderer

• `Const` **Renderer**: [Shared](_shared_core_model_shared_.shared.md)\<[SharedKey](_shared_core_model_sharedkey_.sharedkey.md)\<symbol>, unknown, [Ref](../interfaces/_shared_ref_ref_.ref.md)\<any>> = createShared( Symbol.for('Renderer'), Pure.fromIO(() => createRef\<any>()),)

*Defined in [src/Patch/Renderer.ts:8](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Patch/Renderer.ts#L8)*

A Shared value for the Effect being used to Render a given Namespace.

## Functions

### getRenderer

▸ `Const`**getRenderer**\<A>(): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<readonly [effect: Effect\<any, A>, env: any]>>

*Defined in [src/Patch/Renderer.ts:16](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Patch/Renderer.ts#L16)*

Get the Renderer for the current Namespace

#### Type parameters:

Name |
------ |
`A` |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), [Ref](../interfaces/_shared_ref_ref_.ref.md)\<readonly [effect: Effect\<any, A>, env: any]>>

___

### setRenderer

▸ `Const`**setRenderer**\<E, A>(`effect`: [Effect](_effect_effect_.effect.md)\<E, A>, `env`: E): [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>

*Defined in [src/Patch/Renderer.ts:24](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Patch/Renderer.ts#L24)*

Set the renderer for the current Namespace

#### Type parameters:

Name |
------ |
`E` |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`effect` | [Effect](_effect_effect_.effect.md)\<E, A> |
`env` | E |

**Returns:** [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void>
