**[@typed/fp](../README.md)**

> [Globals](../globals.md) / ["Scheduler/VirtualTimer/VirtualTimer"](../modules/_scheduler_virtualtimer_virtualtimer_.md) / VirtualTimer

# Interface: VirtualTimer

## Hierarchy

* Timer

* [VirtualClock](_scheduler_virtualtimer_virtualclock_.virtualclock.md)

* Disposable

  ↳ **VirtualTimer**

## Index

### Properties

* [progressTimeBy](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#progresstimeby)

### Methods

* [clearTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#cleartimer)
* [dispose](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#dispose)
* [now](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#now)
* [setTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#settimer)

## Properties

### progressTimeBy

• `Readonly` **progressTimeBy**: (elapsedTime: Time) => Time

*Inherited from [VirtualClock](_scheduler_virtualtimer_virtualclock_.virtualclock.md).[progressTimeBy](_scheduler_virtualtimer_virtualclock_.virtualclock.md#progresstimeby)*

*Defined in [src/Scheduler/VirtualTimer/VirtualClock.ts:7](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Scheduler/VirtualTimer/VirtualClock.ts#L7)*

## Methods

### clearTimer

▸ **clearTimer**(`timerHandle`: Handle): void

*Inherited from [VirtualTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md).[clearTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#cleartimer)*

*Defined in node_modules/@most/types/index.d.ts:65*

#### Parameters:

Name | Type |
------ | ------ |
`timerHandle` | Handle |

**Returns:** void

___

### dispose

▸ **dispose**(): void

*Inherited from [LazyDisposable](_disposable_exports_.lazydisposable.md).[dispose](_disposable_exports_.lazydisposable.md#dispose)*

*Defined in node_modules/@most/types/index.d.ts:27*

**Returns:** void

___

### now

▸ **now**(): Time

*Inherited from [VirtualTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md).[now](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#now)*

*Overrides [VirtualClock](_scheduler_virtualtimer_virtualclock_.virtualclock.md).[now](_scheduler_virtualtimer_virtualclock_.virtualclock.md#now)*

*Defined in node_modules/@most/types/index.d.ts:63*

**Returns:** Time

___

### setTimer

▸ **setTimer**(`f`: () => any, `delayTime`: Delay): Handle

*Inherited from [VirtualTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md).[setTimer](_scheduler_virtualtimer_virtualtimer_.virtualtimer.md#settimer)*

*Defined in node_modules/@most/types/index.d.ts:64*

#### Parameters:

Name | Type |
------ | ------ |
`f` | () => any |
`delayTime` | Delay |

**Returns:** Handle
