**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/hooks/getNextSymbol"

# Module: "Shared/hooks/getNextSymbol"

## Index

### Variables

* [getNextSymbol](_shared_hooks_getnextsymbol_.md#getnextsymbol)

## Variables

### getNextSymbol

• `Const` **getNextSymbol**: [Effect](_effect_effect_.effect.md)\<[SharedEnv](../interfaces/_shared_core_services_sharedenv_.sharedenv.md), symbol> = doEffect(function* () { const position = yield* getNextPosition const symbols = yield* getNamespaceSymbols return yield* getOrCreate(symbols, position, () => Pure.of(Symbol(\`HookPosition: ${position}\`)))})

*Defined in [src/Shared/hooks/getNextSymbol.ts:10](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/hooks/getNextSymbol.ts#L10)*

Get the next symbol based on position
