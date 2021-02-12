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

- [x] IO
- [ ] IOEither
- [ ] Option
- [ ] Reader
- [ ] ReaderEither
- [ ] ReaderTask
- [ ] ReaderTaskEither
- [ ] ReadonlyArray
- [ ] ReadonlyMap
- [ ] ReadonlyNonEmptyArray
- [ ] ReadonlyRecord
- [ ] ReadonlySet
- [ ] State
- [ ] StateReaderTaskEither
- [ ] Task
- [ ] TaskEither
- [ ] TaskOption
- [ ] TaskThese
- [ ] These
- [ ] Tree
- [ ] Tuple2
- [ ] Writer

### Comonads

- Is there a syntax for Comonadic syntax we can adopt?

- [ ] Store
- [ ] Traced

### Addition Packages

- [ ] Fibers
- [ ] Shared
- [ ] RemoteData
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
