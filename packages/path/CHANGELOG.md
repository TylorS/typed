# @typed/path

## 0.15.0

### Minor Changes

- [#64](https://github.com/TylorS/typed/pull/64) [`3a6453d`](https://github.com/TylorS/typed/commit/3a6453dedfeec2edd1f36e0feeca36489a8b96cf) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to latest Effect + Rewrite @typed/server in HttpApiBuilder style

## 0.14.0

### Minor Changes

- [`308d020`](https://github.com/TylorS/typed/commit/308d020ee7afd4a103e8a3a0425e48e4198e5a8d) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect + Effect-Http Deps

### Patch Changes

- [`0eda56b`](https://github.com/TylorS/typed/commit/0eda56bbb56c27c828e3589dd44560c7220f4284) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

## 0.13.0

### Minor Changes

- [`a96ca73`](https://github.com/TylorS/typed/commit/a96ca739362e40782cefa2e1eafbd27e023d9f48) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

### Patch Changes

- [`7103937`](https://github.com/TylorS/typed/commit/7103937424a875d3095f8945cb9abc7fbbf22486) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect

- [`419179f`](https://github.com/TylorS/typed/commit/419179f32cab52931da32359a00ed7c820ccdcc3) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

## 0.12.0

### Minor Changes

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect deps

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps to latest

## 0.11.0

### Minor Changes

- [`2ccad98`](https://github.com/TylorS/typed/commit/2ccad98a657d29ee9d6665d0954478781a00c80a) Thanks [@TylorS](https://github.com/TylorS)! - Massive 4-month update - MVP Full-stack Realworld Example

  This has been a pretty massive set of changes that have been ongoing since December, over 300 commits. There was
  lots and lots of trial and error and I didn't properly use changesets along the way.

  @typed/template has gotten a lot of love. Yet another parser implementation, but this time, I decided not to re-invent the wheel so much.
  I have opted to utilize the `html5-parser`'s tokenization which I then convert into Typed's `Template` structure for usage.
  This has improved parsing performance about 2-3x in scenarios I have tested. DOM rendering has been refactored heavily to improve memory usage
  and performance. Hydration in particular, in conjunction with updates to HTML rendering, has had a makeover to improve the accuracy of finding
  existing information in the DOM. In practice, this overhead of hydration is about an extra 2ms of processing for every template instance compared
  to non-hydration DOM rendering. HTML rendering, itself has been refactored to better ensuring proper ordering of HTML render events and to close its
  Scope once all expected events have come through. No changes to its API occured.

  @typed/route has been re-written. It is now based on an AST, fairly similar to `@effect/schema`, and couples the path strings (still based on path-to-regexp syntax) with `Schema`s which can encode/decode values from path strings. It is also possible to get schemas that only work on the `pathname` or `search` portions of a URL.

  @typed/router has been updated to the new @typed/route, but no major API surface changes.

  @typed/server is a new module. It's not much more than a thing Typed wrapper above awesome [effect-http](https://github.com/sukovanej/effect-http) project.
  It's composable and declarative nature make it a perfect fit within the Typed ecosystem. Most of the modules are re-exports from effect-http,
  and I'll list out the differences.

  1. `ApiEndpoint.get`, and all other HTTP methods, now accept a `Route` from `@typed/route` instead of just a path string. This allows a single source of truth for routes, include paths and query parameters. If the route has a Path or QueryParams schema, they will be provided to the ApiEndpoint upon construction.
  2. A custom `Router`, fairly similar and mostly compatible to the one from `@effect/platform/Http/Router`, has been implemented such that the same Routes can be utilized both server-side and browser-side.
  3. Because of the last change the `RouterBuilder` module from `effect-http` has been replaced with a custom version that constructs our custom Router above.
  4. A simple static files middleware with gzip support

  Ideally @typed/server will continue to grow more and more use-cases that align with full-stack applications and other backend-for-frontend patterns and
  provide Typed-specific integrations

  One very big change necessary to getting a @typed/template-based application to seamlessly render both server and browser-side, Computed and Filtered types
  have been updated to utilize `@typed/environment.CurrentEnvironment` to determine the behavior of its `Fx` interfaces. When browser-side, or testing as if it were, their Fx interfaces exist indefinitely while there are subscribers, but server-side it will emit exactly 1 event and then end.

  There were many many more minute changes along the way, but the overall goal was to make a functioning realworld example. This is now complete, but Typed is currently on Effect 3.0.7 and other slightly outdated versions of Effect packages as the ecosystem moves so quickly, and I've had some issues updating to them I've got to sort out.

  The realworld application is definitely still in a kind of MVP state, there's numerous opportunities for better APIs that make it easier to follow and avoid repitition. If you have any suggestions, positive or negative, but constructive, thoughts on how we could further improve things open a github issue or reach out in our Discord channel!

  When the realworld example is in near-perfect condition, I'll be shifting focus to vast improvements to the API references, building a docs website, and then hopefully shipping an Alpha/Beta before the end of the summer.

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
