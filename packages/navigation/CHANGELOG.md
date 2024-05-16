# @typed/navigation

## 0.14.0

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

- Updated dependencies [[`2ccad98`](https://github.com/TylorS/typed/commit/2ccad98a657d29ee9d6665d0954478781a00c80a)]:
  - @typed/context@0.26.0
  - @typed/dom@14.0.0
  - @typed/fx@1.28.0
  - @typed/id@0.7.0

## 0.13.5

### Patch Changes

- Updated dependencies [[`a7e0e92`](https://github.com/TylorS/typed/commit/a7e0e92bfcdcbdb65553c75d5fdc714f41aee15d)]:
  - @typed/fx@1.27.4

## 0.13.4

### Patch Changes

- [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05) Thanks [@TylorS](https://github.com/TylorS)! - Better interpolation reliability

- Updated dependencies [[`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05)]:
  - @typed/context@0.25.1
  - @typed/dom@13.0.1
  - @typed/fx@1.27.3
  - @typed/id@0.6.3

## 0.13.3

### Patch Changes

- Updated dependencies [[`5393bd7`](https://github.com/TylorS/typed/commit/5393bd7d6fe98d034ef7f1af18382c880d62d399), [`1b02026`](https://github.com/TylorS/typed/commit/1b02026c7e9a7ce555badb19e3ff54b93f477fdb)]:
  - @typed/fx@1.27.2

## 0.13.2

### Patch Changes

- Updated dependencies []:
  - @typed/fx@1.27.1

## 0.13.1

### Patch Changes

- Updated dependencies [[`4e9e4da`](https://github.com/TylorS/typed/commit/4e9e4dab5e348fa927995b98f1403454f4ba49d4)]:
  - @typed/fx@1.27.0

## 0.13.0

### Minor Changes

- [`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.4

### Patch Changes

- Updated dependencies [[`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b)]:
  - @typed/context@0.25.0
  - @typed/fx@1.26.0
  - @typed/dom@13.0.0
  - @typed/id@0.6.2

## 0.12.2

### Patch Changes

- Updated dependencies [[`212b234`](https://github.com/TylorS/typed/commit/212b2347237508539ff374e32e8d2a62d80fe823)]:
  - @typed/fx@1.25.0

## 0.12.1

### Patch Changes

- Updated dependencies [[`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114)]:
  - @typed/fx@1.24.1

## 0.12.0

### Minor Changes

- [`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409) Thanks [@TylorS](https://github.com/TylorS)! - Finish swapping type-parameter orders

- [`dd24aac`](https://github.com/TylorS/typed/commit/dd24aac740336c158a8be2d0deeb7c1280ca5b2e) Thanks [@TylorS](https://github.com/TylorS)! - Swap all type-params

### Patch Changes

- Updated dependencies [[`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409), [`a55d04a`](https://github.com/TylorS/typed/commit/a55d04a6d7ea943b611f0958eebb78dc42aa5528), [`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c)]:
  - @typed/fx@1.24.0
  - @typed/context@0.24.1
  - @typed/dom@12.0.1
  - @typed/id@0.6.1

## 0.11.0

### Minor Changes

- [`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.3

### Patch Changes

- [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect to latest

- Updated dependencies [[`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754), [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e)]:
  - @typed/context@0.24.0
  - @typed/dom@12.0.0
  - @typed/fx@1.23.0
  - @typed/id@0.6.0

## 0.10.3

### Patch Changes

- [`e8bc344`](https://github.com/TylorS/typed/commit/e8bc3440053b21c808a1547255b44e441c1bd12a) Thanks [@TylorS](https://github.com/TylorS)! - Initialize Storybook preset

- [`30e652a`](https://github.com/TylorS/typed/commit/30e652aacf3345a01cf84431d0556ab9adae348e) Thanks [@TylorS](https://github.com/TylorS)! - chore: upgrade deps

- Updated dependencies [[`e8bc344`](https://github.com/TylorS/typed/commit/e8bc3440053b21c808a1547255b44e441c1bd12a)]:
  - @typed/dom@11.0.2

## 0.10.2

### Patch Changes

- [`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- [`ad49fd8`](https://github.com/TylorS/typed/commit/ad49fd8fb289b20a5cb4cd147eb898c363706694) Thanks [@TylorS](https://github.com/TylorS)! - Add Navigation.submit + Navigation.onFormData

- Updated dependencies [[`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262)]:
  - @typed/context@0.23.1
  - @typed/dom@11.0.1
  - @typed/fx@1.22.2
  - @typed/id@0.5.1

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @typed/fx@1.22.1

## 0.10.0

### Minor Changes

- [`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to latest @effect/schema w/ R parameter

### Patch Changes

- Updated dependencies [[`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276)]:
  - @typed/context@0.23.0
  - @typed/dom@11.0.0
  - @typed/fx@1.22.0
  - @typed/id@0.5.0

## 0.9.1

### Patch Changes

- [`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

- Updated dependencies [[`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb), [`75cd3ed`](https://github.com/TylorS/typed/commit/75cd3edab120b54a2d9761c3dd5c7a4bd81b970e)]:
  - @typed/context@0.22.1
  - @typed/dom@10.0.1
  - @typed/fx@1.21.1
  - @typed/id@0.4.1

## 0.9.0

### Minor Changes

- [`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595) Thanks [@TylorS](https://github.com/TylorS)! - Start of @typed/core package.

  @typed/core is an existing package, and this will break it's public API to be a part of the larger modern
  Typed project.

### Patch Changes

- Updated dependencies [[`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595)]:
  - @typed/context@0.22.0
  - @typed/dom@10.0.0
  - @typed/fx@1.21.0
  - @typed/id@0.4.0

## 0.8.6

### Patch Changes

- Updated dependencies []:
  - @typed/fx@1.20.6

## 0.8.5

### Patch Changes

- [`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d) Thanks [@TylorS](https://github.com/TylorS)! - Ensure all forked Fibers are attached to Scope

- Updated dependencies [[`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d)]:
  - @typed/context@0.21.3
  - @typed/dom@9.0.4
  - @typed/fx@1.20.5
  - @typed/id@0.3.3

## 0.8.4

### Patch Changes

- [`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41) Thanks [@TylorS](https://github.com/TylorS)! - upgrade Effect

- Updated dependencies [[`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41)]:
  - @typed/context@0.21.2
  - @typed/dom@9.0.3
  - @typed/fx@1.20.4
  - @typed/id@0.3.2

## 0.8.3

### Patch Changes

- [`63f5a6e`](https://github.com/TylorS/typed/commit/63f5a6e105680e9ee4a3efb7f2218d6df7b6b3be) Thanks [@TylorS](https://github.com/TylorS)! - Use Runtime Scope param

- Updated dependencies [[`7b6622c`](https://github.com/TylorS/typed/commit/7b6622c441ed393809df6596490265f8681bf096), [`f1e451a`](https://github.com/TylorS/typed/commit/f1e451aa75816c98c38ce70b700094d9bc45ab90), [`63f5a6e`](https://github.com/TylorS/typed/commit/63f5a6e105680e9ee4a3efb7f2218d6df7b6b3be)]:
  - @typed/fx@1.20.3
  - @typed/dom@9.0.2

## 0.8.2

### Patch Changes

- [`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade all deps

- Updated dependencies [[`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e)]:
  - @typed/context@0.21.1
  - @typed/dom@9.0.1
  - @typed/fx@1.20.2
  - @typed/id@0.3.1

## 0.8.1

### Patch Changes

- Updated dependencies [[`3b28d4a`](https://github.com/TylorS/typed/commit/3b28d4a6e427020571993c263a5b94d3dfdfd34d)]:
  - @typed/fx@1.20.1

## 0.8.0

### Minor Changes

- [`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8) Thanks [@TylorS](https://github.com/TylorS)! - Fx + Template rewrite

### Patch Changes

- Updated dependencies [[`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8)]:
  - @typed/context@0.21.0
  - @typed/dom@9.0.0
  - @typed/fx@1.20.0
  - @typed/id@0.3.0

## 0.7.0

### Minor Changes

- [`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

### Patch Changes

- [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac), [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76)]:
  - @typed/context@0.20.0
  - @typed/dom@8.20.0
  - @typed/fx@1.19.0
  - @typed/id@0.2.0

## 0.6.4

### Patch Changes

- [`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f) Thanks [@TylorS](https://github.com/TylorS)! - Fix internal ESM imports

- Updated dependencies [[`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f)]:
  - @typed/context@0.19.2
  - @typed/dom@8.19.2
  - @typed/fx@1.18.4
  - @typed/id@0.1.3

## 0.6.3

### Patch Changes

- [`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418) Thanks [@TylorS](https://github.com/TylorS)! - Fix ESM builds

- Updated dependencies [[`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418)]:
  - @typed/context@0.19.1
  - @typed/dom@8.19.1
  - @typed/fx@1.18.3
  - @typed/id@0.1.2

## 0.6.2

### Patch Changes

- [`a8442403`](https://github.com/TylorS/typed/commit/a84424031f97e5c5c13bf535901bc8e6b9e2afa4) Thanks [@TylorS](https://github.com/TylorS)! - Fix: Ensure no internal imports exist

- Updated dependencies [[`a8442403`](https://github.com/TylorS/typed/commit/a84424031f97e5c5c13bf535901bc8e6b9e2afa4)]:
  - @typed/fx@1.18.2

## 0.6.1

### Patch Changes

- Updated dependencies [[`974fa90e`](https://github.com/TylorS/typed/commit/974fa90ef507ad724b3cc12d16e9ed7602070794), [`974fa90e`](https://github.com/TylorS/typed/commit/974fa90ef507ad724b3cc12d16e9ed7602070794)]:
  - @typed/context@0.19.0
  - @typed/dom@8.19.0
  - @typed/fx@1.18.1
  - @typed/id@0.1.1

## 0.6.0

### Minor Changes

- [`51729c4c`](https://github.com/TylorS/typed/commit/51729c4c394ee525f84b3dc6886a4156751ff725) Thanks [@TylorS](https://github.com/TylorS)! - Pre-alpha release

## 0.1.0

### Minor Changes

- [`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf) Thanks [@TylorS](https://github.com/TylorS)! - Pre-alpha release

### Patch Changes

- Updated dependencies [[`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf)]:
  - @typed/context@0.1.0
  - @typed/dom@0.1.0
  - @typed/fx@1.18.0
  - @typed/id@0.1.0
