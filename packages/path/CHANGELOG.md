# @typed/path

## 0.10.2

### Patch Changes

- [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05) Thanks [@TylorS](https://github.com/TylorS)! - Better interpolation reliability

## 0.10.1

### Patch Changes

- [`96409d0`](https://github.com/TylorS/typed/commit/96409d01a3ac17ba041cad2a6c28482293362b5a) Thanks [@TylorS](https://github.com/TylorS)! - Improve type-level performance of `@typed/path`'s ParamsOf + Interpolate types.

  This removes the need for @ts-expect-error for possibly infinite types.

  For ParamsOf this was accomplished by switching from a tuple/reduce-based type for creating an intersection of types to a more
  "standard" UnionToIntersection which works by changing the variance.

  For Interpolate this was accomplished by using a type-level map to
  allow TypeScript to narrow the problem space to only the type-level AST types used internally for parsing a path without the need of constraining the input values and dealing with type-level casts.

## 0.10.0

### Minor Changes

- [`6d2e1de`](https://github.com/TylorS/typed/commit/6d2e1debbe6665badeefd200c62657d5159000c4) Thanks [@TylorS](https://github.com/TylorS)! - Rewrite @typed/path to better cover path-to-regexp syntax.

  This release marks a very high confidence that parsing a path that conforms
  to the path-to-regexp syntax will be correct. This includes zero-or-more, one-or-more,
  and optional modifiers, named parameters, unnamed parameters, custom prefixes, etc.

  The only thing missing is arbitrary RegExp support, although some basic support for parsing is
  in place, but the parsed types will still always be `string` even though `path-to-regexp`
  runtime behavior may parse it as something else. If [TypeScript Support](https://github.com/microsoft/TypeScript/pull/55600)
  ever lands for RegExps, it should be trivial to support them.

  For a complete and up-to-date list of all supported syntax, see `/test/type-level/path.ts`
  within the `@typed/path` package to see type-level tests for both parsing and interpolation.

## 0.9.0

### Minor Changes

- [`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595) Thanks [@TylorS](https://github.com/TylorS)! - Start of @typed/core package.

  @typed/core is an existing package, and this will break it's public API to be a part of the larger modern
  Typed project.

## 0.8.0

### Minor Changes

- [`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8) Thanks [@TylorS](https://github.com/TylorS)! - Fx + Template rewrite

## 0.7.2

### Patch Changes

- [`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f) Thanks [@TylorS](https://github.com/TylorS)! - Fix internal ESM imports

## 0.7.1

### Patch Changes

- [`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418) Thanks [@TylorS](https://github.com/TylorS)! - Fix ESM builds

## 0.7.0

### Minor Changes

- [`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf) Thanks [@TylorS](https://github.com/TylorS)! - Pre-alpha release
