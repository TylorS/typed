# @typed/fp

`@typed/fp` is composed of many à-la-carte modules, bringing together [fp-ts](https://gcanti.github.io/fp-ts/) and [@most/core](https://mostcore.readthedocs.io/en/latest/)
with Algebraic Effects and other useful data structures and libraries to help build frontend-focused TypeScript applications.

While not a requirement for usage, the design of `@typed/fp` has been geared towards developing applications using Domain-Driven Design and Onion/Hexagonal/Clean Architectural patterns.

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
| Console | Provides console.* implementations of LoggerEffect from logging module | 
| Disposable | Re-export of Disposable interface from [@most/disposable](https://mostcore.readthedocs.io/en/latest/api.html#most-disposable) w/ additional helpers | 
| dom | DOM-related resources and ffects | 
| Effect | Type-safe Algebraic Effects implementation, based on generator functions. Provides mechanisms for performing dependency injection, | 
| Fiber | Provides a way to manage many asynchronous effects and do simple cooperative scheduling | 
| Future | Effects that return Eithers | 
| history | Work with the History API using Effect | 
| http | Make HTTP requests using Effect | 
| io | Tools built atop of [io-ts](https://github.com/gcanti/io-ts)' "Experimental" Schema-based API | 
| Key | Helpers for creating nominal keys | 
| lambda | Helpers and types for working with functions | 
| logging | Integration between Effect and [logging-ts](https://github.com/gcanti/logging-ts) | 
| logic | Functions for performing common logical operations | 
| Patch | Provides patching functionality atop of Shared for building frontend applications | 
| Path | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Paths | 
| Queue | A simple data-structure for representing queues | 
| RemoteData | A data-structure for representing resources loaded asynchronously | 
| Resume | A Sync/Async effect abstraction, used to power Effect | 
| Scheduler | Some tools atop of [@most/scheduler](https://mostcore.readthedocs.io/en/latest/api.html#most-scheduler) for working with Effect + Fiber. | 
| Shared | A dynamic key-value store with lifecycle events. Keep state using Effect. Provides optional React hooks + Context API equivalents that can be tested without rendering. | 
| Storage | A library of storage-related functionality. Provides wrappers for localStorage, sessionStorage, and IndexedDB using Effect.
| Stream | [fp-ts](https://gcanti.github.io/fp-ts/) integration with [@most/core](https://mostcore.readthedocs.io/en/latest/) as well as integration with the rest of @typed/fp. | 
| Uri | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Universal Resource Identifiers  | 
| Uuid | A [Newtype](https://github.com/gcanti/newtype-ts) for representing Universally Unique Identifiers, built atop of Effect. | 

#### Resource Modules

It is a goal of @typed/fp to be generally functional in all environments that support es2019 including 
browsers and node. When there are the need for environment-specific implementations of any Effects they will be able to be found within `@typed/fp/browser` and `@typed/fp/node` for browser and node-specific implementations respectively. 
