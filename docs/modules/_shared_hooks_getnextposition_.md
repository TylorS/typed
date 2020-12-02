**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/getNextPosition"

# Module: "Shared/hooks/getNextPosition"

## Index

### Variables

* [getNextPosition](_shared_hooks_getnextposition_.md#getnextposition)

## Variables

### getNextPosition

• `Const` **getNextPosition**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), number> = doEffect(function* () { const position = yield* getNamespacePosition const current = position.current position.current = position.current + 1 return current})

*Defined in [src/Shared/hooks/getNextPosition.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/hooks/getNextPosition.ts#L9)*

Get the current namespace's next position
