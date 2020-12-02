**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Shared/State/State"

# Module: "Shared/State/State"

## Index

### Type aliases

* [State](_shared_state_state_.md#state)

### Variables

* [applyReducer](_shared_state_state_.md#applyreducer)
* [contramap](_shared_state_state_.md#contramap)
* [promap](_shared_state_state_.md#promap)
* [setState](_shared_state_state_.md#setstate)
* [updateState](_shared_state_state_.md#updatestate)

### Functions

* [getState](_shared_state_state_.md#getstate)

## Type aliases

### State

Ƭ  **State**\<A, B>: readonly [IO\<A>, [Arity1](_common_types_.md#arity1)\<B, A>]

*Defined in [src/Shared/State/State.ts:10](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L10)*

A getter-setter pair. Profunctor-like, without a proper functor instance. Useful for
interfacing with UI libraries that use callbacks.

#### Type parameters:

Name | Default |
------ | ------ |
`A` | - |
`B` | A |

## Variables

### applyReducer

• `Const` **applyReducer**: \<A, B, C>(reducer: (a: A, b: B) => C, state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<A, B>\<A, B, C>(reducer: (a: A, b: B) => C) => (state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<A, B> = curry( \<A, B, C>(reducer: (a: A, b: B) => C, state: State\<A, C>): State\<A, B> => contramap((b) => reducer(getState(state), b), state),) as { \<A, B, C>(reducer: (a: A, b: B) => C, state: State\<A, C>): State\<A, B> \<A, B, C>(reducer: (a: A, b: B) => C): (state: State\<A, C>) => State\<A, B>}

*Defined in [src/Shared/State/State.ts:73](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L73)*

Apply a reducer to a piece of state.

___

### contramap

• `Const` **contramap**: \<A, B, C>(f: (a: A) => B, state: [State](_shared_state_state_.md#state)\<C, B>) => [State](_shared_state_state_.md#state)\<C, A>\<A, B>(f: (a: A) => B) => \<C>(state: [State](_shared_state_state_.md#state)\<C, B>) => [State](_shared_state_state_.md#state)\<C, A> = curry( \<A, B, C>(f: (a: A) => B, state: State\<C, B>): State\<C, A> => pipe(state, promap(identity, f)),) as { \<A, B, C>(f: (a: A) => B, state: State\<C, B>): State\<C, A> \<A, B>(f: (a: A) => B): \<C>(state: State\<C, B>) => State\<C, A>}

*Defined in [src/Shared/State/State.ts:43](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L43)*

Change the right hand value of a piece of state.

___

### promap

• `Const` **promap**: \<A, B, C, D>(f: (a: A) => B, g: (d: D) => C, state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<B, D>\<A, B, C, D>(f: (a: A) => B, g: (d: D) => C) => (state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<B, D>\<A, B>(f: (a: A) => B) => \<C, D>(g: (d: D) => C, state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<B, D>\<C, D>(g: (d: D) => C) => (state: [State](_shared_state_state_.md#state)\<A, C>) => [State](_shared_state_state_.md#state)\<B, D> = curry( \<A, B, C, D>(f: (a: A) => B, g: (d: D) => C, [getA, sendC]: State\<A, C>): State\<B, D> => [ pipe(getA, mapIo(f)), flow(g, sendC, f), ],) as { \<A, B, C, D>(f: (a: A) => B, g: (d: D) => C, state: State\<A, C>): State\<B, D> \<A, B, C, D>(f: (a: A) => B, g: (d: D) => C): (state: State\<A, C>) => State\<B, D> \<A, B>(f: (a: A) => B): { \<C, D>(g: (d: D) => C, state: State\<A, C>): State\<B, D> \<C, D>(g: (d: D) => C): (state: State\<A, C>) => State\<B, D> }}

*Defined in [src/Shared/State/State.ts:55](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L55)*

Change the left and right side values of state. Helpful for
focusing in on a individual piece of state.

___

### setState

• `Const` **setState**: \<A, B>(value: A, state: [State](_shared_state_state_.md#state)\<B, A>) => B\<A>(value: A) => \<B>(state: [State](_shared_state_state_.md#state)\<B, A>) => B = curry(\<A, B>(value: A, state: State\<B, A>): B => state[1](value)) as { \<A, B>(value: A, state: State\<B, A>): B \<A>(value: A): \<B>(state: State\<B, A>) => B}

*Defined in [src/Shared/State/State.ts:20](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L20)*

Set the current state.

___

### updateState

• `Const` **updateState**: \<A, B>(f: (value: A) => B, state: [State](_shared_state_state_.md#state)\<A, B>) => A\<A, B>(f: (value: A) => B) => (state: [State](_shared_state_state_.md#state)\<A, B>) => A = curry( \<A, B>(f: (value: A) => B, state: State\<A, B>): A => { const a = getState(state) const b = f(a) return setState(b, state) },) as { \<A, B>(f: (value: A) => B, state: State\<A, B>): A \<A, B>(f: (value: A) => B): (state: State\<A, B>) => A}

*Defined in [src/Shared/State/State.ts:28](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L28)*

Perform and update with the current piece of state

## Functions

### getState

▸ `Const`**getState**\<A, B>(`state`: [State](_shared_state_state_.md#state)\<A, B>): A

*Defined in [src/Shared/State/State.ts:15](https://github.com/TylorS/typed-fp/blob/6ccb290/src/Shared/State/State.ts#L15)*

Get the current state.

#### Type parameters:

Name |
------ |
`A` |
`B` |

#### Parameters:

Name | Type |
------ | ------ |
`state` | [State](_shared_state_state_.md#state)\<A, B> |

**Returns:** A
