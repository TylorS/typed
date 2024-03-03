# @typed/guard

## 0.1.3

### Patch Changes

- [`d8ff1e2`](https://github.com/TylorS/typed/commit/d8ff1e2bc2538d4b17d6c05b781ab2237d833f05) Thanks [@TylorS](https://github.com/TylorS)! - Better interpolation reliability

## 0.1.2

### Patch Changes

- [`2a84e8b`](https://github.com/TylorS/typed/commit/2a84e8befc18efb864ec270474e315a4b878be51) Thanks [@TylorS](https://github.com/TylorS)! - Optimize multiple calls to the Guard produced by Guard.any({...})
  by getting the Guard instance only once at the time of creation.

## 0.1.1

### Patch Changes

- [`a2150dc`](https://github.com/TylorS/typed/commit/a2150dc232cc7c123a1e9e520267e29c74504501) Thanks [@TylorS](https://github.com/TylorS)! - Expand Guard combinators

## 0.1.0

### Minor Changes

- [`4e9e4da`](https://github.com/TylorS/typed/commit/4e9e4dab5e348fa927995b98f1403454f4ba49d4) Thanks [@TylorS](https://github.com/TylorS)! - Extract @typed/fx/Guard to @typed/guard for reuse in @typed/route.

  - Removes the need for @typed/route to have a dependency on @typed/fx.
  - Removes duplicated combinators from @typed/route that can now live in @typed/guard.
