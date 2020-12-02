**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/SharedValueEvent"](_shared_core_events_sharedvalueevent_.md) / SharedValueUpdated

# Namespace: SharedValueUpdated

A Shared value has been updated in the environment for a given namespace.

## Index

### Variables

* [schema](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedValueUpdated](_shared_core_events_sharedvalueevent_.sharedvalueupdated.md)> = createSchema\<SharedValueUpdated>((t) => t.type({ type: t.literal('sharedValue/updated'), namespace: Namespace.schema(t), shared: Shared.schema(t), value: t.unknown, previousValue: t.unknown, }), )

*Defined in [src/Shared/core/events/SharedValueEvent.ts:54](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/core/events/SharedValueEvent.ts#L54)*
