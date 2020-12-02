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

## API Documentation

For the time being documentation documentation is generated using TypeDoc available [here](./globals.md)
