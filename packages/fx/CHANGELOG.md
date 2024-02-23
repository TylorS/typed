# @typed/fx

## 1.26.0

### Minor Changes

- [`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.4

### Patch Changes

- Updated dependencies [[`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b)]:
  - @typed/async-data@0.7.0
  - @typed/context@0.25.0

## 1.25.0

### Minor Changes

- [#47](https://github.com/TylorS/typed/pull/47) [`212b234`](https://github.com/TylorS/typed/commit/212b2347237508539ff374e32e8d2a62d80fe823) Thanks [@TylorS](https://github.com/TylorS)! - RefSubject get/unsafeGet(Exit)

## 1.24.1

### Patch Changes

- [`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114) Thanks [@TylorS](https://github.com/TylorS)! - Add support in @typed/ui/Platform for converting RouteMatcher to @effect/platform's HttpServer.router.Router.

  This also required changing the signature's of `@typed/template`'s `render`/`hydrate`/`renderToHtml` signatures to not exclude `RenderTemplate`
  from its context. This necessitated adding `renderLayer`, `hydrateLayer`, and `serverLayer`/`staticLayer` to be able to provide `RenderTemplate` in
  a standalone context, and also better supports re-using the `RenderContext` between different requests during SSR.

  Since the recommended way to create a long-lived application, such as a UI application, in Effect is with `Layer.launch`, `renderToLayer` and `hydrateToLayer`
  have been added as APIs for quickly setting up a render with the appropriate resources. See `examples/counter` or `examples/todomvc` for examples of this.

## 1.24.0

### Minor Changes

- [`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409) Thanks [@TylorS](https://github.com/TylorS)! - Finish swapping type-parameter orders

- [`a55d04a`](https://github.com/TylorS/typed/commit/a55d04a6d7ea943b611f0958eebb78dc42aa5528) Thanks [@TylorS](https://github.com/TylorS)! - Swap type-parameter order for all types

### Patch Changes

- [`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c) Thanks [@TylorS](https://github.com/TylorS)! - refactor: more type-parameter switching

- Updated dependencies [[`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c)]:
  - @typed/context@0.24.1

## 1.23.0

### Minor Changes

- [`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.3

### Patch Changes

- [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect to latest

- Updated dependencies [[`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754), [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e)]:
  - @typed/async-data@0.6.0
  - @typed/context@0.24.0

## 1.22.2

### Patch Changes

- [`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262)]:
  - @typed/async-data@0.5.2
  - @typed/context@0.23.1

## 1.22.1

### Patch Changes

- Updated dependencies [[`afc377d`](https://github.com/TylorS/typed/commit/afc377df0ac5de0c74353b2655691f366ba9af19)]:
  - @typed/async-data@0.5.1

## 1.22.0

### Minor Changes

- [`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to latest @effect/schema w/ R parameter

### Patch Changes

- Updated dependencies [[`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276)]:
  - @typed/async-data@0.5.0
  - @typed/context@0.23.0

## 1.21.1

### Patch Changes

- [`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

- [`75cd3ed`](https://github.com/TylorS/typed/commit/75cd3edab120b54a2d9761c3dd5c7a4bd81b970e) Thanks [@TylorS](https://github.com/TylorS)! - Throttle should emit immediately

- Updated dependencies [[`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb)]:
  - @typed/async-data@0.4.1
  - @typed/context@0.22.1

## 1.21.0

### Minor Changes

- [`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595) Thanks [@TylorS](https://github.com/TylorS)! - Start of @typed/core package.

  @typed/core is an existing package, and this will break it's public API to be a part of the larger modern
  Typed project.

### Patch Changes

- Updated dependencies [[`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595)]:
  - @typed/async-data@0.4.0
  - @typed/context@0.22.0

## 1.20.6

### Patch Changes

- Updated dependencies [[`ba79c88`](https://github.com/TylorS/typed/commit/ba79c88c4b1f0b10d3aa6ce08c345fd57d13a0b7)]:
  - @typed/async-data@0.3.4

## 1.20.5

### Patch Changes

- [`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d) Thanks [@TylorS](https://github.com/TylorS)! - Ensure all forked Fibers are attached to Scope

- Updated dependencies [[`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d)]:
  - @typed/async-data@0.3.3
  - @typed/context@0.21.3

## 1.20.4

### Patch Changes

- [`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41) Thanks [@TylorS](https://github.com/TylorS)! - upgrade Effect

- Updated dependencies [[`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41)]:
  - @typed/async-data@0.3.2
  - @typed/context@0.21.2

## 1.20.3

### Patch Changes

- [`7b6622c`](https://github.com/TylorS/typed/commit/7b6622c441ed393809df6596490265f8681bf096) Thanks [@TylorS](https://github.com/TylorS)! - Ensure RefSubject.tuple/struct use Fx.hold

- [`f1e451a`](https://github.com/TylorS/typed/commit/f1e451aa75816c98c38ce70b700094d9bc45ab90) Thanks [@TylorS](https://github.com/TylorS)! - use FiberSet for unboundedFork

- [`63f5a6e`](https://github.com/TylorS/typed/commit/63f5a6e105680e9ee4a3efb7f2218d6df7b6b3be) Thanks [@TylorS](https://github.com/TylorS)! - Use Runtime Scope param

## 1.20.2

### Patch Changes

- [`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade all deps

- Updated dependencies [[`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e)]:
  - @typed/async-data@0.3.1
  - @typed/context@0.21.1

## 1.20.1

### Patch Changes

- [`3b28d4a`](https://github.com/TylorS/typed/commit/3b28d4a6e427020571993c263a5b94d3dfdfd34d) Thanks [@TylorS](https://github.com/TylorS)! - fix: ensure (Ref)Subject close resources correctly

## 1.20.0

### Minor Changes

- [`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8) Thanks [@TylorS](https://github.com/TylorS)! - Fx + Template rewrite

### Patch Changes

- Updated dependencies [[`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8)]:
  - @typed/async-data@0.3.0
  - @typed/context@0.21.0

## 1.19.0

### Minor Changes

- [`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

### Patch Changes

- [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac), [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76)]:
  - @typed/async-data@0.2.0
  - @typed/context@0.20.0

## 1.18.4

### Patch Changes

- [`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f) Thanks [@TylorS](https://github.com/TylorS)! - Fix internal ESM imports

- Updated dependencies [[`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f)]:
  - @typed/async-data@0.1.2
  - @typed/context@0.19.2

## 1.18.3

### Patch Changes

- [`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418) Thanks [@TylorS](https://github.com/TylorS)! - Fix ESM builds

- Updated dependencies [[`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418)]:
  - @typed/async-data@0.1.1
  - @typed/context@0.19.1

## 1.18.2

### Patch Changes

- [`a8442403`](https://github.com/TylorS/typed/commit/a84424031f97e5c5c13bf535901bc8e6b9e2afa4) Thanks [@TylorS](https://github.com/TylorS)! - Fix: Ensure no internal imports exist

## 1.18.1

### Patch Changes

- Updated dependencies [[`974fa90e`](https://github.com/TylorS/typed/commit/974fa90ef507ad724b3cc12d16e9ed7602070794)]:
  - @typed/context@0.19.0

## 1.18.0

### Minor Changes

- [`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf) Thanks [@TylorS](https://github.com/TylorS)! - Pre-alpha release

### Patch Changes

- Updated dependencies [[`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf)]:
  - @typed/async-data@0.1.0
  - @typed/context@0.1.0
