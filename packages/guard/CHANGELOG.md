# @typed/guard

## 0.1.1

### Patch Changes

- [`a2150dc`](https://github.com/TylorS/typed/commit/a2150dc232cc7c123a1e9e520267e29c74504501) Thanks [@TylorS](https://github.com/TylorS)! - Expand Guard combinators

## 0.1.0

### Minor Changes

- [`4e9e4da`](https://github.com/TylorS/typed/commit/4e9e4dab5e348fa927995b98f1403454f4ba49d4) Thanks [@TylorS](https://github.com/TylorS)! - Extract @typed/fx/Guard to @typed/guard for reuse in @typed/route.

  - Removes the need for @typed/route to have a dependency on @typed/fx.
  - Removes duplicated combinators from @typed/route that can now live in @typed/guard.
