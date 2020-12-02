**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceStarted

# Namespace: NamespaceStarted

When an Effect correlated to a namespace is being run.

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespacestarted.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceStarted](_shared_core_events_namespaceevent_.namespacestarted.md)> = createSchema\<NamespaceStarted>((t) => t.type({ type: t.literal('namespace/started'), parent: Namespace.schema(t), namespace: Namespace.schema(t), effect: t.unknown as HKT\<any, Effect\<any, any>>, }), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:57](https://github.com/TylorS/typed-fp/blob/559f273/src/Shared/core/events/NamespaceEvent.ts#L57)*
