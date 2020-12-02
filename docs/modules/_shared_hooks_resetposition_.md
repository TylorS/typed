**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/resetPosition"

# Module: "Shared/hooks/resetPosition"

## Index

### Variables

* [resetPosition](_shared_hooks_resetposition_.md#resetposition)

## Variables

### resetPosition

• `Const` **resetPosition**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), void> = doEffect(function* () { const position = yield* getNamespacePosition position.current = 0})

*Defined in [src/Shared/hooks/resetPosition.ts:8](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/hooks/resetPosition.ts#L8)*

Reset the current namespace's position.s
