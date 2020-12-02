**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Queue/Queue"](../modules/_queue_queue_.md) / Queue

# Interface: Queue\<A>

A synchronous, likely in-memory, representation of a Queue.

## Type parameters

Name |
------ |
`A` |

## Hierarchy

* **Queue**

## Index

### Properties

* [dequeue](_queue_queue_.queue.md#dequeue)
* [dequeueAll](_queue_queue_.queue.md#dequeueall)
* [enqueue](_queue_queue_.queue.md#enqueue)
* [peek](_queue_queue_.queue.md#peek)
* [remove](_queue_queue_.queue.md#remove)
* [some](_queue_queue_.queue.md#some)

## Properties

### dequeue

• `Readonly` **dequeue**: IO\<Option\<A>>

*Defined in [src/Queue/Queue.ts:9](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L9)*

___

### dequeueAll

• `Readonly` **dequeueAll**: IO\<ReadonlyArray\<A>>

*Defined in [src/Queue/Queue.ts:10](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L10)*

___

### enqueue

• `Readonly` **enqueue**: (...values: ReadonlyArray\<A>) => void

*Defined in [src/Queue/Queue.ts:8](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L8)*

___

### peek

• `Readonly` **peek**: IO\<Option\<A>>

*Defined in [src/Queue/Queue.ts:11](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L11)*

___

### remove

• `Readonly` **remove**: (f: (value: A) => boolean) => void

*Defined in [src/Queue/Queue.ts:13](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L13)*

___

### some

• `Readonly` **some**: (f: (value: A) => boolean) => boolean

*Defined in [src/Queue/Queue.ts:12](https://github.com/TylorS/typed-fp/blob/41076ce/src/Queue/Queue.ts#L12)*
