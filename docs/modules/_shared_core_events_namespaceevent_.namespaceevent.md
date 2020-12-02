**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceEvent

# Namespace: NamespaceEvent

All of the Namespace-specific events

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespaceevent.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceEvent](_shared_core_events_namespaceevent_.namespaceevent.md)> = createSchema((t) => t.union( NamespaceCreated.schema(t), NamespaceStarted.schema(t), NamespaceUpdated.schema(t), NamespaceCompleted.schema(t), NamespaceDeleted.schema(t), ), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:18](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/events/NamespaceEvent.ts#L18)*
