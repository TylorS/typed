**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/SharedValueEvent"](_shared_core_events_sharedvalueevent_.md) / SharedValueDeleted

# Namespace: SharedValueDeleted

A Shared value has been deleted from a given Namespace.

## Index

### Variables

* [schema](_shared_core_events_sharedvalueevent_.sharedvaluedeleted.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedValueDeleted](_shared_core_events_sharedvalueevent_.sharedvaluedeleted.md)> = createSchema\<SharedValueDeleted>((t) => t.type({ type: t.literal('sharedValue/deleted'), namespace: Namespace.schema(t), shared: Shared.schema(t), }), )

*Defined in [src/Shared/core/events/SharedValueEvent.ts:75](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/events/SharedValueEvent.ts#L75)*
