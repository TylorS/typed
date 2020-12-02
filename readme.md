# @typed/fp

`@typed/fp` is composed of many à-la-carte modules, bringing together [fp-ts](https://gcanti.github.io/fp-ts/) and [@most/core](https://mostcore.readthedocs.io/en/latest/)
with Algebraic Effects and other useful data structures and libraries to help build frontend-focused TypeScript applications.

While not a requirement for usage, the design of `@typed/fp` has been geared towards developing applications using Domain-Driven Design and Onion/Hexagonal/Clean Architectural patterns.

Until a v1.0.0 there will likely be many more breaking changes, but it's getting to the point where it's very much usable and the key pieces of complexity have been tested. 

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

## Modules

All modules can be imported directly using `@typed/fp/MODULE_NAME`

| Name    | Description |
| --------|-------------|
| [common](./src/common/readme.md)  | A couple of shared types and instances between other modules |
| [Console](./src/Console/readme.md) | Provides console.* implementations of LoggerEffect from `logging` module | 
| [Disposable](./src/Disposable/readme.md) | Re-export of Disposable interface from [@most/disposable](https://mostcore.readthedocs.io/en/latest/api.html#most-disposable) w/ additional helpers | 
| [dom](./src/dom/readme.md) | DOM-related resources and ffects | 
| [Effect](./src/Effect/readme.md) | Type-safe Algebraic Effects implementation, based on generator functions. Provides mechanisms for performing dependency injection, and unifies sync + async workflows with automatic resource management and async cancellation. | 
| [Fiber](./src/Fiber/readme.md) | Provides a way to manage many asynchronous effects and do simple cooperative scheduling | 
| [Future](./src/Future/readme.md) | Effects that return Eithers | 
| [history](./src/history/readme.md) | Work with the History API using Effect | 
| [http](./src/http/readme.md) | Make HTTP requests using Effect | 
| [io](./src/io/readme.md) | Tools built atop of [io-ts](https://github.com/gcanti/io-ts)' "Experimental" Schema-based API | 
| [Key](./src/Key/readme.md) | Helpers for creating nominal keys | 
| [lambda](./src/lambda/readme.md) | Helpers and types for working with functions | 
| [logging](./src/logging/readme.md) | Integration between Effect and [logging-ts](https://github.com/gcanti/logging-ts) | 
| [logic](./src/logic/readme.md) | Functions for performing common logical operations | 
| [Patch](./src/Patch/readme.md) | Provides patching functionality atop of Shared for building frontend applications | 
| [Path](./src/Path/readme.md) | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Paths | 
| [Queue](./src/Queue/readme.md) | A simple data-structure for representing queues | 
| [RemoteData](./src/RemoteData/readme.md) | A data-structure for representing resources loaded asynchronously | 
| [Resume](./src/Resume/readme.md) | A Sync/Async effect abstraction, used to power Effect | 
| [Scheduler](./src/Scheduler/readme.md) | Some tools atop of [@most/scheduler](https://mostcore.readthedocs.io/en/latest/api.html#most-scheduler) for working with Effect + Fiber. | 
| [Shared](./src/Shared/readme.md) | A dynamic key-value store with lifecycle events. Keep state using Effect. Provides optional React hooks + Context API equivalents that can be tested without rendering. | 
| [Storage](./src/Storage/readme.md) | A library of storage-related functionality. Provides wrappers for localStorage, sessionStorage, and IndexedDB using Effect.
| [Stream](./src/Stream/readme.md) | [fp-ts](https://gcanti.github.io/fp-ts/) integration with [@most/core](https://mostcore.readthedocs.io/en/latest/) as well as integration with the rest of @typed/fp. | 
| [Uri](./src/Uri/readme.md) | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Universal Resource Identifiers  | 
| [Uuid](./src/Uuid/readme.md) | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Universally Unique Identifiers, built atop of Effect. | 

#### Resource Modules

It is a goal of @typed/fp to be generally functional in all environments that support es2019 including 
browsers and node. When there are the need for environment-specific implementations of any Effects they will be able to be found within [@typed/fp/browser](./src/browser/readme.md) and [@typed/fp/node](./src/node/readme.md) for browser and node-specific implementations respectively. 


## Documentation

Currently generated documentation is available [here](./docs)

