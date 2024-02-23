# @typed/router

## 0.26.2

### Patch Changes

- Updated dependencies [[`7d440f1`](https://github.com/TylorS/typed/commit/7d440f148b5fc09c62cbd35dbcd773cad6c5c43b)]:
  - @typed/navigation@0.13.0
  - @typed/context@0.25.0
  - @typed/fx@1.26.0
  - @typed/dom@13.0.0
  - @typed/environment@0.6.2
  - @typed/route@3.2.4

## 0.26.1

### Patch Changes

- Updated dependencies [[`212b234`](https://github.com/TylorS/typed/commit/212b2347237508539ff374e32e8d2a62d80fe823)]:
  - @typed/fx@1.25.0
  - @typed/navigation@0.12.2
  - @typed/route@3.2.3

## 0.26.0

### Minor Changes

- [`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114) Thanks [@TylorS](https://github.com/TylorS)! - Add support in @typed/ui/Platform for converting RouteMatcher to @effect/platform's HttpServer.router.Router.

  This also required changing the signature's of `@typed/template`'s `render`/`hydrate`/`renderToHtml` signatures to not exclude `RenderTemplate`
  from its context. This necessitated adding `renderLayer`, `hydrateLayer`, and `serverLayer`/`staticLayer` to be able to provide `RenderTemplate` in
  a standalone context, and also better supports re-using the `RenderContext` between different requests during SSR.

  Since the recommended way to create a long-lived application, such as a UI application, in Effect is with `Layer.launch`, `renderToLayer` and `hydrateToLayer`
  have been added as APIs for quickly setting up a render with the appropriate resources. See `examples/counter` or `examples/todomvc` for examples of this.

### Patch Changes

- Updated dependencies [[`ff2c311`](https://github.com/TylorS/typed/commit/ff2c311c4144d2378a4bde7065b4e382ad183114)]:
  - @typed/fx@1.24.1
  - @typed/navigation@0.12.1
  - @typed/route@3.2.2

## 0.25.0

### Minor Changes

- [`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409) Thanks [@TylorS](https://github.com/TylorS)! - Finish swapping type-parameter orders

### Patch Changes

- [`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c) Thanks [@TylorS](https://github.com/TylorS)! - refactor: more type-parameter switching

- Updated dependencies [[`c900700`](https://github.com/TylorS/typed/commit/c90070011834374ec3f6afed187ebc20b282a409), [`a55d04a`](https://github.com/TylorS/typed/commit/a55d04a6d7ea943b611f0958eebb78dc42aa5528), [`3b3ab28`](https://github.com/TylorS/typed/commit/3b3ab28620b5b01233964daa709d019161269a3c), [`dd24aac`](https://github.com/TylorS/typed/commit/dd24aac740336c158a8be2d0deeb7c1280ca5b2e), [`1f7ea9f`](https://github.com/TylorS/typed/commit/1f7ea9fd3aa1c0fa708c5f6460cd8965c754a46a)]:
  - @typed/navigation@0.12.0
  - @typed/fx@1.24.0
  - @typed/context@0.24.1
  - @typed/dom@12.0.1
  - @typed/route@3.2.1
  - @typed/environment@0.6.1

## 0.24.0

### Minor Changes

- [`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to Effect 2.3

### Patch Changes

- [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade effect to latest

- Updated dependencies [[`07f8fb2`](https://github.com/TylorS/typed/commit/07f8fb242be356baabf44e7b3470ce2e5b859754), [`1c385d3`](https://github.com/TylorS/typed/commit/1c385d36d95d77bcde8e586a5d4e96aff4be920e)]:
  - @typed/environment@0.6.0
  - @typed/navigation@0.11.0
  - @typed/context@0.24.0
  - @typed/route@3.2.0
  - @typed/dom@12.0.0
  - @typed/fx@1.23.0

## 0.23.3

### Patch Changes

- Updated dependencies [[`e8bc344`](https://github.com/TylorS/typed/commit/e8bc3440053b21c808a1547255b44e441c1bd12a), [`30e652a`](https://github.com/TylorS/typed/commit/30e652aacf3345a01cf84431d0556ab9adae348e)]:
  - @typed/navigation@0.10.3
  - @typed/dom@11.0.2

## 0.23.2

### Patch Changes

- [`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`a790363`](https://github.com/TylorS/typed/commit/a7903635c148362809f39bdad120655f668a0262), [`ad49fd8`](https://github.com/TylorS/typed/commit/ad49fd8fb289b20a5cb4cd147eb898c363706694)]:
  - @typed/environment@0.5.1
  - @typed/navigation@0.10.2
  - @typed/context@0.23.1
  - @typed/route@3.1.2
  - @typed/dom@11.0.1
  - @typed/fx@1.22.2

## 0.23.1

### Patch Changes

- Updated dependencies []:
  - @typed/fx@1.22.1
  - @typed/navigation@0.10.1
  - @typed/route@3.1.1

## 0.23.0

### Minor Changes

- [`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade to latest @effect/schema w/ R parameter

### Patch Changes

- Updated dependencies [[`e5a9baf`](https://github.com/TylorS/typed/commit/e5a9baf92b283187ce547f5664a2e15587721276)]:
  - @typed/environment@0.5.0
  - @typed/navigation@0.10.0
  - @typed/context@0.23.0
  - @typed/route@3.1.0
  - @typed/dom@11.0.0
  - @typed/fx@1.22.0

## 0.22.1

### Patch Changes

- [`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

- Updated dependencies [[`41c4b1b`](https://github.com/TylorS/typed/commit/41c4b1b17718b8f06ba006716a752aebc7c4b5cb), [`75cd3ed`](https://github.com/TylorS/typed/commit/75cd3edab120b54a2d9761c3dd5c7a4bd81b970e)]:
  - @typed/environment@0.4.1
  - @typed/navigation@0.9.1
  - @typed/context@0.22.1
  - @typed/route@3.0.1
  - @typed/dom@10.0.1
  - @typed/fx@1.21.1

## 0.22.0

### Minor Changes

- [`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595) Thanks [@TylorS](https://github.com/TylorS)! - Start of @typed/core package.

  @typed/core is an existing package, and this will break it's public API to be a part of the larger modern
  Typed project.

### Patch Changes

- Updated dependencies [[`0b5c6ed`](https://github.com/TylorS/typed/commit/0b5c6edd739f753c5616a07cee5b9e08f8507595)]:
  - @typed/context@0.22.0
  - @typed/dom@10.0.0
  - @typed/environment@0.4.0
  - @typed/fx@1.21.0
  - @typed/navigation@0.9.0
  - @typed/path@0.9.0
  - @typed/route@3.0.0

## 0.21.6

### Patch Changes

- Updated dependencies []:
  - @typed/fx@1.20.6
  - @typed/navigation@0.8.6
  - @typed/route@2.0.6

## 0.21.5

### Patch Changes

- [`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d) Thanks [@TylorS](https://github.com/TylorS)! - Ensure all forked Fibers are attached to Scope

- Updated dependencies [[`15da154`](https://github.com/TylorS/typed/commit/15da15406c3ec50a1cba475b785d038878c5370d)]:
  - @typed/environment@0.3.3
  - @typed/navigation@0.8.5
  - @typed/context@0.21.3
  - @typed/route@2.0.5
  - @typed/dom@9.0.4
  - @typed/fx@1.20.5

## 0.21.4

### Patch Changes

- [`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41) Thanks [@TylorS](https://github.com/TylorS)! - upgrade Effect

- Updated dependencies [[`644b790`](https://github.com/TylorS/typed/commit/644b790ff1b9ba976edc7a436408f548972e0b41)]:
  - @typed/environment@0.3.2
  - @typed/navigation@0.8.4
  - @typed/context@0.21.2
  - @typed/route@2.0.4
  - @typed/dom@9.0.3
  - @typed/fx@1.20.4

## 0.21.3

### Patch Changes

- Updated dependencies [[`7b6622c`](https://github.com/TylorS/typed/commit/7b6622c441ed393809df6596490265f8681bf096), [`f1e451a`](https://github.com/TylorS/typed/commit/f1e451aa75816c98c38ce70b700094d9bc45ab90), [`63f5a6e`](https://github.com/TylorS/typed/commit/63f5a6e105680e9ee4a3efb7f2218d6df7b6b3be)]:
  - @typed/fx@1.20.3
  - @typed/navigation@0.8.3
  - @typed/dom@9.0.2
  - @typed/route@2.0.3

## 0.21.2

### Patch Changes

- [`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade all deps

- Updated dependencies [[`def0809`](https://github.com/TylorS/typed/commit/def08097d847bab113a0aebe22ffdcebaed5804e)]:
  - @typed/environment@0.3.1
  - @typed/navigation@0.8.2
  - @typed/context@0.21.1
  - @typed/route@2.0.2
  - @typed/dom@9.0.1
  - @typed/fx@1.20.2

## 0.21.1

### Patch Changes

- Updated dependencies [[`3b28d4a`](https://github.com/TylorS/typed/commit/3b28d4a6e427020571993c263a5b94d3dfdfd34d)]:
  - @typed/fx@1.20.1
  - @typed/navigation@0.8.1
  - @typed/route@2.0.1

## 0.21.0

### Minor Changes

- [`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8) Thanks [@TylorS](https://github.com/TylorS)! - Fx + Template rewrite

### Patch Changes

- Updated dependencies [[`708e9f5`](https://github.com/TylorS/typed/commit/708e9f58860702a7b8290ea261b1dad8b4b1c1c8)]:
  - @typed/context@0.21.0
  - @typed/dom@9.0.0
  - @typed/environment@0.3.0
  - @typed/fx@1.20.0
  - @typed/navigation@0.8.0
  - @typed/path@0.8.0
  - @typed/route@2.0.0

## 0.20.0

### Minor Changes

- [`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac) Thanks [@TylorS](https://github.com/TylorS)! - Update Effect deps

### Patch Changes

- [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76) Thanks [@TylorS](https://github.com/TylorS)! - Upgrade Effect deps

- Updated dependencies [[`9760e38`](https://github.com/TylorS/typed/commit/9760e38d3f38cc7d75fb3362c1691d82ac795bac), [`fc07fb6`](https://github.com/TylorS/typed/commit/fc07fb6b4716b4dc198cdc480ff8f345f9f7ef76)]:
  - @typed/environment@0.2.0
  - @typed/navigation@0.7.0
  - @typed/context@0.20.0
  - @typed/route@1.1.0
  - @typed/dom@8.20.0
  - @typed/fx@1.19.0

## 0.19.5

### Patch Changes

- [`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f) Thanks [@TylorS](https://github.com/TylorS)! - Fix internal ESM imports

- Updated dependencies [[`b79f52b8`](https://github.com/TylorS/typed/commit/b79f52b8f30b33db609880e1c7304a0d82e3bc7f)]:
  - @typed/context@0.19.2
  - @typed/dom@8.19.2
  - @typed/environment@0.1.3
  - @typed/fx@1.18.4
  - @typed/navigation@0.6.4
  - @typed/path@0.7.2
  - @typed/route@1.0.4

## 0.19.4

### Patch Changes

- [`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418) Thanks [@TylorS](https://github.com/TylorS)! - Fix ESM builds

- Updated dependencies [[`bd591ce4`](https://github.com/TylorS/typed/commit/bd591ce436247967cd0daeb5413335f06aea4418)]:
  - @typed/context@0.19.1
  - @typed/dom@8.19.1
  - @typed/environment@0.1.2
  - @typed/fx@1.18.3
  - @typed/navigation@0.6.3
  - @typed/path@0.7.1
  - @typed/route@1.0.3

## 0.19.3

### Patch Changes

- Updated dependencies [[`a8442403`](https://github.com/TylorS/typed/commit/a84424031f97e5c5c13bf535901bc8e6b9e2afa4)]:
  - @typed/navigation@0.6.2
  - @typed/fx@1.18.2
  - @typed/route@1.0.2

## 0.19.2

### Patch Changes

- Updated dependencies [[`974fa90e`](https://github.com/TylorS/typed/commit/974fa90ef507ad724b3cc12d16e9ed7602070794), [`974fa90e`](https://github.com/TylorS/typed/commit/974fa90ef507ad724b3cc12d16e9ed7602070794)]:
  - @typed/context@0.19.0
  - @typed/dom@8.19.0
  - @typed/environment@0.1.1
  - @typed/fx@1.18.1
  - @typed/navigation@0.6.1
  - @typed/route@1.0.1

## 0.19.1

### Patch Changes

- Updated dependencies [[`51729c4c`](https://github.com/TylorS/typed/commit/51729c4c394ee525f84b3dc6886a4156751ff725)]:
  - @typed/navigation@0.6.0

## 0.19.0

### Minor Changes

- [`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf) Thanks [@TylorS](https://github.com/TylorS)! - Pre-alpha release

### Patch Changes

- Updated dependencies [[`5db779a2`](https://github.com/TylorS/typed/commit/5db779a2d2a0f6d78d5853dee6ca92b7385474bf)]:
  - @typed/context@0.1.0
  - @typed/dom@0.1.0
  - @typed/environment@0.1.0
  - @typed/fx@1.18.0
  - @typed/navigation@0.1.0
  - @typed/path@0.7.0
  - @typed/route@1.0.0
