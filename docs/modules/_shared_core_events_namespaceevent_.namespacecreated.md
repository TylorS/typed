**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Shared/core/events/NamespaceEvent"](_shared_core_events_namespaceevent_.md) / NamespaceCreated

# Namespace: NamespaceCreated

When a Namespace is added to the environment

## Index

### Variables

* [schema](_shared_core_events_namespaceevent_.namespacecreated.md#schema)

## Variables

### schema

• `Const` **schema**: [TypedSchema](../interfaces/_io_typedschema_.typedschema.md)\<[NamespaceCreated](_shared_core_events_namespaceevent_.namespacecreated.md)> = createSchema\<NamespaceCreated>((t) => t.type({ type: t.literal('namespace/created'), namespace: Namespace.schema(t), }), )

*Defined in [src/Shared/core/events/NamespaceEvent.ts:38](https://github.com/TylorS/typed-fp/blob/8639976/src/Shared/core/events/NamespaceEvent.ts#L38)*
