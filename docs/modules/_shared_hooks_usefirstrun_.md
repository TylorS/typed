**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/useFirstRun"

# Module: "Shared/hooks/useFirstRun"

## Index

### Variables

* [pureTrue](_shared_hooks_usefirstrun_.md#puretrue)
* [useFirstRun](_shared_hooks_usefirstrun_.md#usefirstrun)

## Variables

### pureTrue

• `Const` **pureTrue**: [Pure](_effect_effect_.md#pure)\<boolean> = Pure.of(true)

*Defined in [src/Shared/hooks/useFirstRun.ts:6](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/useFirstRun.ts#L6)*

___

### useFirstRun

• `Const` **useFirstRun**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), boolean> = doEffect(function* () { const ref = yield* useRef(pureTrue) if (ref.current) { ref.current = false return true } return ref.current})

*Defined in [src/Shared/hooks/useFirstRun.ts:11](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/useFirstRun.ts#L11)*

Track if it's the first time running in this namespace.
