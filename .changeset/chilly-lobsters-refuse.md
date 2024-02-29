---
"@typed/path": patch
---

Improve type-level performance of `@typed/path`'s ParamsOf + Interpolate types.

This removes the need for @ts-expect-error for possibly infinite types. 

For ParamsOf this was accomplished by switching from a tuple/reduce-based type for creating an intersection of types to a more 
"standard" UnionToIntersection which works by changing the variance.

For Interpolate this was accomplished by using a type-level map to
allow TypeScript to narrow the problem space to only the type-level AST types used internally for parsing a path without the need of constraining the input values and dealing with type-level casts.
