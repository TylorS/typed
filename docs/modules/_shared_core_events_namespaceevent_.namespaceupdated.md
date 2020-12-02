**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceUpdated

# Namespace: NamespaceUpdated

When a namespace has changed.

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespaceupdated.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceUpdated](_shared_core_events_namespaceevent_.namespaceupdated.md)> = createSchema\<NamespaceUpdated>((t) => t.type({ type: t.literal('namespace/updated'), namespace: Namespace.schema(t), }), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:76](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/events/NamespaceEvent.ts#L76)*
