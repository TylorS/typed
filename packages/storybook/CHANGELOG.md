# @typed/storybook

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
