**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/SharedValueEvent"](_shared_core_events_sharedvalueevent_.md) / SharedValueEvent

# Namespace: SharedValueEvent

Shared value lifecycle events

## Index

### Variables

* [schema](_shared_core_events_sharedvalueevent_.sharedvalueevent.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedValueEvent](_shared_core_events_sharedvalueevent_.sharedvalueevent.md)> = createSchema\<SharedValueEvent>((t) => t.union( SharedValueCreated.schema(t), SharedValueUpdated.schema(t), SharedValueDeleted.schema(t), ), )

*Defined in [src/Shared/core/events/SharedValueEvent.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Shared/core/events/SharedValueEvent.ts#L12)*
