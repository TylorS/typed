**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/core/services/getCurrentNamespace"

# Module: "Shared/core/services/getCurrentNamespace"

## Index

### Variables

* [getCurrentNamespace](_shared_core_services_getcurrentnamespace_.md#getcurrentnamespace)

## Variables

### getCurrentNamespace

• `Const` **getCurrentNamespace**: [Effect](_effect_effect_.effect.md)\<[CurrentNamespaceEnv](../interfaces/_shared_core_services_currentnamespaceenv_.currentnamespaceenv.md), [Namespace](_shared_core_model_namespace_.namespace.md)> = asks( (e: CurrentNamespaceEnv) => e.currentNamespace,)

*Defined in [src/Shared/core/services/getCurrentNamespace.ts:9](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/services/getCurrentNamespace.ts#L9)*

Get the current namespace an effect is operating within
