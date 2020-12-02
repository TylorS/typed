**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/SharedValueEvent"](_shared_core_events_sharedvalueevent_.md) / SharedValueCreated

# Namespace: SharedValueCreated

A Shared value has been added to the environment for a given namespace.

## Index

### Variables

* [schema](_shared_core_events_sharedvalueevent_.sharedvaluecreated.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedValueCreated](_shared_core_events_sharedvalueevent_.sharedvaluecreated.md)> = createSchema\<SharedValueCreated>((t) => t.type({ type: t.literal('sharedValue/created'), namespace: Namespace.schema(t), shared: Shared.schema(t), value: t.unknown, }), )

*Defined in [src/Shared/core/events/SharedValueEvent.ts:32](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/events/SharedValueEvent.ts#L32)*
