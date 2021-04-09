# @typed/fp

`@typed/fp` is conceptually an extension [fp-ts](https://gcanti.github.io/fp-ts/), with cancelable async effects, do-notation, fiber, hooks, and more through an integration with [@most/core](https://github.com/most.js/core).

This project is under very heavy development. It is my goal to align with `fp-ts` v3 which is currently also under heavy development and once both codebases are stable I intend to make the 1.0 release.

## TODO

All of the following modules will also need corresponding Fx implementations if not 
currently implemented.

### Modules

- [ ] These
- [ ] ResumeThese
- [ ] EnvThese
- [ ] Writer
- [ ] NonEmptyArray
- [ ] ReadonlyNonEmptyArray
- [ ] ReadonlyArray

### Libraries

- [ ] Hooks
- [ ] Rendering

### Conversions

I need to make sure we can interop with as many types as possible, so for all the types that can implement these interfaces we'll want to make sure all of the kliesi arrows are 
implemented as well.

- [ ] FromEither
- [ ] FromIO
- [ ] FromTask
- [ ] FromReader
- [ ] FromState 
- [ ] FromResume 
- [ ] FromEnv 
- [ ] FromThese 

### Derivable Implementations

We'll want to make sure that all of the derivable functions given a type-class are available, including missing instances of those type-classes.

- [ ] Alt 
- [ ] Alternative 
- [ ] Apply 
- [ ] Bifunctor 
- [ ] Category 
- [ ] Chain 
- [ ] Choice 
- [ ] Compactable 
- [ ] Contravariant 
- [ ] Filterable 
- [ ] Foldable 
- [ ] Functor 
- [ ] Invariant 
- [ ] Monad 
- [ ] Monoid 
- [ ] Ord 
- [ ] Profunctor 
- [ ] Semigroup 
- [ ] Semigroupoid
- [ ] Separated
- [ ] Show
- [ ] Strong
- [ ] Traversable
- [ ] Unfoldable
- [ ] Witherable

### Examples

I'd love suggestions as to what kinds of examples would be useful! Feel free to open an
issue, I'd like to make this more accessible than just hard API documentation.

- [ ] fp-to-the-max
- [ ] react
- [ ] uhtml
- [ ] 
