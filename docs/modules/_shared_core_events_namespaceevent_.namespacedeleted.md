**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceDeleted

# Namespace: NamespaceDeleted

When a Namespace is being deleted from the environment.

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespacedeleted.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceDeleted](_shared_core_events_namespaceevent_.namespacedeleted.md)> = createSchema\<NamespaceDeleted>((t) => t.type({ type: t.literal('namespace/deleted'), namespace: Namespace.schema(t), }), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:116](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/Shared/core/events/NamespaceEvent.ts#L116)*
