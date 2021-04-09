# @typed/fp

`@typed/fp` is conceptually an extension [fp-ts](https://gcanti.github.io/fp-ts/), with cancelable async effects, do-notation, fiber, hooks, and more through an integration with [@most/core](https://github.com/most.js/core).

This project is under very heavy development. It is my goal to align with `fp-ts` v3 which is currently also under heavy development and once both codebases are stable I intend to make the 1.0 release.

## TODO

All of the following modules will also need corresponding Fx implementations if not 
currently implemented.

### Modules

- [x] Reader
- [x] ReaderEither
- [x] ReaderTask
- [x] ReaderTaskEither
- [x] State
- [x] StateReaderTaskEither
- [x] Task
- [x] TaskEither
- [x] TaskOption
- [-] TaskThese
- [-] Writer
- [-] ResumeThese
- [-] EnvThese
- [ ] StateEnvEither

### Libraries

- [ ] Hooks
- [ ] Rendering
- [ ] 

### Examples

I'd love suggestions as to what kinds of examples would be useful! Feel free to open an
issue, I'd like to make this more accessible than just hard API documentation.

- [ ] fp-to-the-max
- [ ] react
- [ ] 
