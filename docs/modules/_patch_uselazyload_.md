**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Patch/useLazyLoad"

# Module: "Patch/useLazyLoad"

## Index

### Functions

* [useLazyLoad](_patch_uselazyload_.md#uselazyload)

## Functions

### useLazyLoad

▸ `Const`**useLazyLoad**\<A, E, B>(`task`: Task\<A>, `f`: (value: A) => [Effect](_effect_effect_.effect.md)\<E, B>, `fallback`: IO\<B>): [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), B>

*Defined in [src/Patch/useLazyLoad.ts:23](https://github.com/TylorS/typed-fp/blob/8639976/src/Patch/useLazyLoad.ts#L23)*

A hook function for lazy loading a module using dynamic imports.

**`example`** 
function* runModule(m: typeof import('./myView')) {
 const data = yield* getMyData()

 return m.myView(data)
}

const lazyLoadedView = doEffect(function*() {
 const html = yield* useLazyLoad(() => import('./myView'), m => doEffect(() => runModule(m)), constant(loadingView))

 return html
})

#### Type parameters:

Name |
------ |
`A` |
`E` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`task` | Task\<A> |
`f` | (value: A) => [Effect](_effect_effect_.effect.md)\<E, B> |
`fallback` | IO\<B> |

**Returns:** [Effect](_effect_effect_.effect.md)\<E & [SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md) & [SchedulerEnv](../interfaces/_scheduler_schedulerenv_.schedulerenv.md), B>
