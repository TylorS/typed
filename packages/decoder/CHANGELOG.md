# @typed/decoder

## 0.20.0

### Minor Changes

- [`308d020`](https://github.com/TylorS/typed/commit/308d020ee7afd4a103e8a3a0425e48e4198e5a8d) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect + Effect-Http Deps

### Patch Changes

- [`0eda56b`](https://github.com/TylorS/typed/commit/0eda56bbb56c27c828e3589dd44560c7220f4284) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

## 0.19.0

### Minor Changes

- [`a96ca73`](https://github.com/TylorS/typed/commit/a96ca739362e40782cefa2e1eafbd27e023d9f48) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

### Patch Changes

- [`7103937`](https://github.com/TylorS/typed/commit/7103937424a875d3095f8945cb9abc7fbbf22486) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect

- [`419179f`](https://github.com/TylorS/typed/commit/419179f32cab52931da32359a00ed7c820ccdcc3) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

## 0.18.0

### Minor Changes

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect deps

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps to latest

## 0.17.0

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

## 0.16.1

### Patch Changes

- [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05) Thanks [@TylorS](https://github.com/TylorS)! - Better interpolation reliability

## 0.16.0

### Minor Changes

- [`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.3

### Patch Changes

- [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect to latest

## 0.15.1

### Patch Changes

- [`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

## 0.15.0

### Minor Changes

- [`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to latest @effect/schema w/ R parameter

## 0.14.1

### Patch Changes

- [`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

## 0.14.0

### Minor Changes

- [`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595) Thanks [@TylorS](https://github.com/TylorS)! - Start of @typed/core package.

  @typed/core is an existing package, and this will break it's public API to be a part of the larger modern
  Typed project.

## 0.13.1

### Patch Changes

- [`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d) Thanks [@TylorS](https://github.com/TylorS)! - Ensure all forked Fibers are attached to Scope

## 0.13.0

### Minor Changes

- [`9df04cd`](https://github.com/TylorS/typed/commit/9df04cdd3e8f9bd4a28c3c573aad3e0a0c7706bb) Thanks [@TylorS](https://github.com/TylorS)! - Experimental Decoder package
