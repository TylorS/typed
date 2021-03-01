# @typed/fp

`@typed/fp` is composed of many à-la-carte modules, bringing together [fp-ts](https://gcanti.github.io/fp-ts/) and [@most/core](https://mostcore.readthedocs.io/en/latest/)
with Algebraic Effects and other useful data structures and libraries to help build frontend-focused TypeScript applications.

## Install

### NPM

```sh
# NPM
npm i --save @typed/fp

# Yarn
yarn add @typed/fp
```

### Import Statement 

```js
import * as fp from 'https://cdn.skypack.dev/@typed/fp'
```

## Support

At present only modern environments that support ES2019 Syntax, including newer version of Node. Lets keep the web improving! 

## Things still todo

### Monads

- [ ] EnvThese
- [ ] EnvTheseFx
- [ ] EffThese
- [ ] EffTheseFx
- [ ] ResumeThese
- [ ] ResumeTheseFx
- [ ] StateEnv
- [ ] StateEnvFx
- [ ] StateEnvEither
- [ ] StateEnvEitherFx
- [ ] StateEnvThese
- [ ] StateEnvTheseFx
- [ ] FxThese
- [ ] StreamEither
- [ ] StreamThese
- [x] IO
- [x] IOFx
- [ ] IOEither
- [ ] IOEitherFx
- [ ] Option
- [ ] OptionFx
- [x] Reader
- [x] ReaderFx
- [ ] ReaderEither
- [ ] ReaderEitherFx
- [ ] ReaderTask
- [ ] ReaderTaskFx
- [ ] ReaderTaskEither
- [ ] ReaderTaskEitherFx
- [ ] ReadonlyArray
- [ ] ReadonlyArrayFx
- [ ] ReadonlyMap
- [ ] ReadonlyMapFx
- [ ] ReadonlyNonEmptyArray
- [ ] ReadonlyNonEmptyArrayFx
- [ ] ReadonlyRecord
- [ ] ReadonlyRecordFx
- [ ] ReadonlySet
- [ ] ReadonlySetFx
- [ ] State
- [ ] StateFx
- [ ] StateReaderTaskEither
- [ ] StateReaderTaskEitherFx
- [ ] Task
- [ ] TaskFx
- [ ] TaskEither
- [ ] TaskEitherFx
- [ ] TaskOption
- [ ] TaskOptionFX
- [ ] TaskThese
- [ ] TaskTheseFx
- [ ] These
- [ ] TheseFx
- [ ] Tree
- [ ] TreeFx
- [ ] Tuple2
- [ ] Tuple2Fx
- [ ] Writer
- [ ] WriterFx

### Comonads

- Explore Co (CoMonad->Monad), Pairings (Comonad+Monad), Day convolution and related concepts..
  
### Addition Packages

- [ ] Shared - Key-values built atop of MonadAsk
  - [ ] EnvShared
  - [ ] EffShared
  - [ ] ReaderShared
- [ ] FromResume
  - [ ] fromResume(FromTask)
- [ ] ToTask
- [ ] ToResume
  - [ ] toResume(ToTask)
- [ ] Failures - Ask + FromResume/ToResume
- [ ] Fibers
- [ ] RemoteData
- [ ] RemoteDataFx
- [ ] ADT generators
- [ ] io-ts or custom ??
- [ ] Tagged types 
- [ ] Graphs
- [ ] History API
- [ ] Queue
- [ ] Storage
- [ ] HTTP
- [ ] Logging
- [ ] Logical operators
- [ ] Node + Browser implementations
- [ ] Services Workers
- [ ] JSON-RPC
