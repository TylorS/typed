# @typed/storybook

## 0.8.0

### Minor Changes

- [`308d020`](https://github.com/TylorS/typed/commit/308d020ee7afd4a103e8a3a0425e48e4198e5a8d) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect + Effect-Http Deps

### Patch Changes

- [`0eda56b`](https://github.com/TylorS/typed/commit/0eda56bbb56c27c828e3589dd44560c7220f4284) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`308d020`](https://github.com/TylorS/typed/commit/308d020ee7afd4a103e8a3a0425e48e4198e5a8d), [`0eda56b`](https://github.com/TylorS/typed/commit/0eda56bbb56c27c828e3589dd44560c7220f4284)]:
  - @typed/environment@0.10.0
  - @typed/async-data@0.11.0
  - @typed/navigation@0.17.0
  - @typed/template@0.13.0
  - @typed/context@0.29.0
  - @typed/decoder@0.20.0
  - @typed/router@0.31.0
  - @typed/route@8.0.0
  - @typed/core@3.6.0
  - @typed/path@0.14.0
  - @typed/dom@17.0.0
  - @typed/fx@1.31.0
  - @typed/id@0.10.0
  - @typed/ui@0.13.0

## 0.7.0

### Minor Changes

- [`a96ca73`](https://github.com/TylorS/typed/commit/a96ca739362e40782cefa2e1eafbd27e023d9f48) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

### Patch Changes

- [`7103937`](https://github.com/TylorS/typed/commit/7103937424a875d3095f8945cb9abc7fbbf22486) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect

- [`419179f`](https://github.com/TylorS/typed/commit/419179f32cab52931da32359a00ed7c820ccdcc3) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`7103937`](https://github.com/TylorS/typed/commit/7103937424a875d3095f8945cb9abc7fbbf22486), [`3686d1f`](https://github.com/TylorS/typed/commit/3686d1f4085467365b42a397d4a1b1e6ba106632), [`4b067f8`](https://github.com/TylorS/typed/commit/4b067f8081b2ee40bdaf55fc002a17ab98382e75), [`a96ca73`](https://github.com/TylorS/typed/commit/a96ca739362e40782cefa2e1eafbd27e023d9f48), [`419179f`](https://github.com/TylorS/typed/commit/419179f32cab52931da32359a00ed7c820ccdcc3)]:
  - @typed/environment@0.9.0
  - @typed/async-data@0.10.0
  - @typed/navigation@0.16.0
  - @typed/template@0.12.0
  - @typed/context@0.28.0
  - @typed/decoder@0.19.0
  - @typed/router@0.30.0
  - @typed/route@7.0.0
  - @typed/core@3.5.0
  - @typed/path@0.13.0
  - @typed/dom@16.0.0
  - @typed/fx@1.30.0
  - @typed/id@0.9.0
  - @typed/ui@0.12.0

## 0.6.0

### Minor Changes

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect deps

- [#60](https://github.com/TylorS/typed/pull/60) [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps to latest

### Patch Changes

- Updated dependencies [[`9a34f62`](https://github.com/TylorS/typed/commit/9a34f62af1c2e91d1437e3ccda80d5256f0edd8a), [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7), [`96fb8b4`](https://github.com/TylorS/typed/commit/96fb8b4be9f673e3a8dfff16e801d70ca207c6d7)]:
  - @typed/template@0.11.0
  - @typed/environment@0.8.0
  - @typed/async-data@0.9.0
  - @typed/navigation@0.15.0
  - @typed/context@0.27.0
  - @typed/decoder@0.18.0
  - @typed/router@0.29.0
  - @typed/route@6.0.0
  - @typed/core@3.4.0
  - @typed/path@0.12.0
  - @typed/dom@15.0.0
  - @typed/fx@1.29.0
  - @typed/id@0.8.0
  - @typed/ui@0.11.0

## 0.5.0

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

### Patch Changes

- Updated dependencies [[`15414fd`](https://github.com/TylorS/typed/commit/15414fdefa9521c6eb9971133ccab00c293596b3), [`2ccad98`](https://github.com/TylorS/typed/commit/2ccad98a657d29ee9d6665d0954478781a00c80a)]:
  - @typed/async-data@0.8.0
  - @typed/context@0.26.0
  - @typed/core@3.3.0
  - @typed/decoder@0.17.0
  - @typed/dom@14.0.0
  - @typed/environment@0.7.0
  - @typed/fx@1.28.0
  - @typed/id@0.7.0
  - @typed/navigation@0.14.0
  - @typed/path@0.11.0
  - @typed/route@5.0.0
  - @typed/router@0.28.0
  - @typed/template@0.10.0
  - @typed/ui@0.10.0

## 0.4.7

### Patch Changes

- Updated dependencies [[`a7e0e92`](https://github.com/TylorS/typed/commit/a7e0e92bfcdcbdb65553c75d5fdc714f41aee15d)]:
  - @typed/fx@1.27.4
  - @typed/core@3.2.12
  - @typed/navigation@0.13.5
  - @typed/router@0.27.7
  - @typed/template@0.9.6
  - @typed/ui@0.9.8

## 0.4.6

### Patch Changes

- [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05) Thanks [@TylorS](https://github.com/TylorS)! - Better interpolation reliability

- Updated dependencies [[`6d69d94`](https://github.com/TylorS/typed/commit/6d69d940643adb3b371890db139f5b2457b59a06), [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05)]:
  - @typed/environment@0.6.3
  - @typed/template@0.9.5
  - @typed/router@0.27.6
  - @typed/async-data@0.7.1
  - @typed/navigation@0.13.4
  - @typed/context@0.25.1
  - @typed/decoder@0.16.1
  - @typed/route@4.0.3
  - @typed/core@3.2.11
  - @typed/path@0.10.2
  - @typed/dom@13.0.1
  - @typed/fx@1.27.3
  - @typed/id@0.6.3
  - @typed/ui@0.9.7

## 0.4.5

### Patch Changes

- Updated dependencies [[`9793c9c`](https://github.com/TylorS/typed/commit/9793c9c50cef11ae6d89085719a1c0c34acbc12a), [`9c9cfc8`](https://github.com/TylorS/typed/commit/9c9cfc86c3c7211d73e4b9a5976e74b581a99b66)]:
  - @typed/template@0.9.4
  - @typed/router@0.27.5
  - @typed/core@3.2.10
  - @typed/ui@0.9.6

## 0.4.4

### Patch Changes

- Updated dependencies [[`96409d0`](https://github.com/TylorS/typed/commit/96409d01a3ac17ba041cad2a6c28482293362b5a)]:
  - @typed/path@0.10.1
  - @typed/core@3.2.9
  - @typed/route@4.0.2
  - @typed/router@0.27.4
  - @typed/ui@0.9.5

## 0.4.3

### Patch Changes

- Updated dependencies [[`5393bd7`](https://github.com/TylorS/typed/commit/5393bd7d6fe98d034ef7f1af18382c880d62d399), [`1b02026`](https://github.com/TylorS/typed/commit/1b02026c7e9a7ce555badb19e3ff54b93f477fdb), [`5d29269`](https://github.com/TylorS/typed/commit/5d2926994865aea5064c8a0ffdc1dadfd2369b3a)]:
  - @typed/fx@1.27.2
  - @typed/template@0.9.3
  - @typed/core@3.2.8
  - @typed/navigation@0.13.3
  - @typed/router@0.27.3
  - @typed/ui@0.9.4
  - @typed/route@4.0.1

## 0.4.2

### Patch Changes

- Updated dependencies [[`6d2e1de`](https://github.com/TylorS/typed/commit/6d2e1debbe6665badeefd200c62657d5159000c4)]:
  - @typed/route@4.0.0
  - @typed/path@0.10.0
  - @typed/core@3.2.7
  - @typed/router@0.27.2
  - @typed/ui@0.9.3

## 0.4.1

### Patch Changes

- Updated dependencies [[`a2150dc`](https://github.com/TylorS/typed/commit/a2150dc232cc7c123a1e9e520267e29c74504501)]:
  - @typed/route@3.3.1
  - @typed/core@3.2.6
  - @typed/fx@1.27.1
  - @typed/router@0.27.1
  - @typed/ui@0.9.2
  - @typed/navigation@0.13.2
  - @typed/template@0.9.2

## 0.4.0

### Minor Changes

- [`4e9e4da`](https://github.com/TylorS/typed/commit/4e9e4dab5e348fa927995b98f1403454f4ba49d4) Thanks [@TylorS](https://github.com/TylorS)! - Extract @typed/fx/Guard to @typed/guard for reuse in @typed/route.

  - Removes the need for @typed/route to have a dependency on @typed/fx.
  - Removes duplicated combinators from @typed/route that can now live in @typed/guard.

### Patch Changes

- Updated dependencies [[`4e9e4da`](https://github.com/TylorS/typed/commit/4e9e4dab5e348fa927995b98f1403454f4ba49d4), [`024b4bc`](https://github.com/TylorS/typed/commit/024b4bc4a7fdf93110bd23a03bec1525a8f4a743)]:
  - @typed/router@0.27.0
  - @typed/route@3.3.0
  - @typed/fx@1.27.0
  - @typed/core@3.2.5
  - @typed/ui@0.9.1
  - @typed/navigation@0.13.1
  - @typed/template@0.9.1

## 0.3.2

### Patch Changes

- Updated dependencies [[`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b)]:
  - @typed/async-data@0.7.0
  - @typed/navigation@0.13.0
  - @typed/template@0.9.0
  - @typed/context@0.25.0
  - @typed/fx@1.26.0
  - @typed/ui@0.9.0
  - @typed/core@3.2.4
  - @typed/router@0.26.2
  - @typed/dom@13.0.0
  - @typed/environment@0.6.2
  - @typed/id@0.6.2
  - @typed/route@3.2.4

## 0.3.1

### Patch Changes

- Updated dependencies [[`212b234`](https://github.com/TylorS/typed/commit/212b2347237508539ff374e32e8d2a62d80fe823)]:
  - @typed/fx@1.25.0
  - @typed/core@3.2.3
  - @typed/navigation@0.12.2
  - @typed/route@3.2.3
  - @typed/router@0.26.1
  - @typed/template@0.8.1
  - @typed/ui@0.8.1

## 0.3.0

### Minor Changes

- [`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114) Thanks [@TylorS](https://github.com/TylorS)! - Add support in @typed/ui/Platform for converting RouteMatcher to @effect/platform's HttpServer.router.Router.

  This also required changing the signature's of `@typed/template`'s `render`/`hydrate`/`renderToHtml` signatures to not exclude `RenderTemplate`
  from its context. This necessitated adding `renderLayer`, `hydrateLayer`, and `serverLayer`/`staticLayer` to be able to provide `RenderTemplate` in
  a standalone context, and also better supports re-using the `RenderContext` between different requests during SSR.

  Since the recommended way to create a long-lived application, such as a UI application, in Effect is with `Layer.launch`, `renderToLayer` and `hydrateToLayer`
  have been added as APIs for quickly setting up a render with the appropriate resources. See `examples/counter` or `examples/todomvc` for examples of this.

### Patch Changes

- Updated dependencies [[`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114), [`5747fb9`](https://github.com/TylorS/typed/commit/5747fb9741b48dc17bdaf176effb4dc358616d10)]:
  - @typed/template@0.8.0
  - @typed/router@0.26.0
  - @typed/fx@1.24.1
  - @typed/ui@0.8.0
  - @typed/core@3.2.2
  - @typed/navigation@0.12.1
  - @typed/route@3.2.2

## 0.2.0

### Minor Changes

- [`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409) Thanks [@TylorS](https://github.com/TylorS)! - Finish swapping type-parameter orders

### Patch Changes

- Updated dependencies [[`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409), [`a55d04a`](https://github.com/TylorS/typed/commit/a55d04a6d7ea943b611f0958eebb78dc42aa5528), [`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c), [`dd24aac`](https://github.com/TylorS/typed/commit/dd24aac740336c158a8be2d0deeb7c1280ca5b2e), [`1f7ea9f`](https://github.com/TylorS/typed/commit/1f7ea9fd3aa1c0fa708c5f6460cd8965c754a46a)]:
  - @typed/navigation@0.12.0
  - @typed/template@0.7.0
  - @typed/router@0.25.0
  - @typed/fx@1.24.0
  - @typed/ui@0.7.0
  - @typed/context@0.24.1
  - @typed/dom@12.0.1
  - @typed/route@3.2.1
  - @typed/core@3.2.1
  - @typed/environment@0.6.1
  - @typed/id@0.6.1

## 0.1.0

### Minor Changes

- [`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.3

### Patch Changes

- [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect to latest

- Updated dependencies [[`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754), [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e)]:
  - @typed/environment@0.6.0
  - @typed/async-data@0.6.0
  - @typed/navigation@0.11.0
  - @typed/template@0.6.0
  - @typed/context@0.24.0
  - @typed/decoder@0.16.0
  - @typed/router@0.24.0
  - @typed/route@3.2.0
  - @typed/core@3.2.0
  - @typed/dom@12.0.0
  - @typed/fx@1.23.0
  - @typed/id@0.6.0
  - @typed/ui@0.6.0

## 0.0.2

### Patch Changes

- [`73903b4`](https://github.com/TylorS/typed/commit/73903b455946275cc14f740408181f8285412b3c) Thanks [@TylorS](https://github.com/TylorS)! - preview file for rendering stories

## 0.0.1

### Patch Changes

- Updated dependencies [[`e8bc344`](https://github.com/TylorS/typed/commit/e8bc3440053b21c808a1547255b44e441c1bd12a), [`30e652a`](https://github.com/TylorS/typed/commit/30e652aacf3345a01cf84431d0556ab9adae348e)]:
  - @typed/navigation@0.10.3
  - @typed/core@3.1.4
  - @typed/dom@11.0.2
  - @typed/ui@0.5.4
  - @typed/template@0.5.4
  - @typed/router@0.23.3
