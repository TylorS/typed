**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceCompleted

# Namespace: NamespaceCompleted

When an Effect related to a specific Namespace has completed.

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespacecompleted.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceCompleted](_shared_core_events_namespaceevent_.namespacecompleted.md)> = createSchema\<NamespaceCompleted>((t) => t.type({ type: t.literal('namespace/completed'), parent: Namespace.schema(t), namespace: Namespace.schema(t), returnValue: t.unknown, effect: t.unknown as HKT\<any, Effect\<any, any>>, }), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:96](https://github.com/TylorS/typed-fp/blob/41076ce/src/Shared/core/events/NamespaceEvent.ts#L96)*
