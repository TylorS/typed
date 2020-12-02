**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/SharedEvent"](_shared_core_events_sharedevent_.md) / SharedEvent

# Namespace: SharedEvent

All of the lifecycle events of Namespaces and Shared values

## Index

### Variables

* [schema](_shared_core_events_sharedevent_.sharedevent.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[SharedEvent](_shared_core_events_sharedevent_.sharedevent.md)> = createSchema\<SharedEvent>((t) => t.union(NamespaceEvent.schema(t), SharedValueEvent.schema(t)), )

*Defined in [src/Shared/core/events/SharedEvent.ts:12](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/core/events/SharedEvent.ts#L12)*
