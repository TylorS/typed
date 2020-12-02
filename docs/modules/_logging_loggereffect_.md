**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logging/LoggerEffect"

# Module: "logging/LoggerEffect"

## Index

### Modules

* ["HKT"](_logging_loggereffect_._hkt_.md)

### Interfaces

* [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)

### Type aliases

* [URI](_logging_loggereffect_.md#uri)

### Variables

* [URI](_logging_loggereffect_.md#uri)
* [contramap](_logging_loggereffect_.md#contramap)
* [filter](_logging_loggereffect_.md#filter)
* [getMonoid](_logging_loggereffect_.md#getmonoid)
* [loggerM](_logging_loggereffect_.md#loggerm)

### Object literals

* [loggerEffect](_logging_loggereffect_.md#loggereffect)

## Type aliases

### URI

Ƭ  **URI**: *typeof* [URI](_logging_loggereffect_.md#uri)

*Defined in [src/logging/LoggerEffect.ts:12](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L12)*

## Variables

### URI

• `Const` **URI**: \"@typed/fp/logging/LoggerEffect\" = "@typed/fp/logging/LoggerEffect"

*Defined in [src/logging/LoggerEffect.ts:11](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L11)*

___

### contramap

•  **contramap**: \<A, B>(f: (b: B) => A) => \<E>(fa: Kind2\<F, E, A>) => Kind2\<F, E, B>

*Defined in [src/logging/LoggerEffect.ts:45](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L45)*

___

### filter

• `Const` **filter**: \<E, A>(logger: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<E, A>, predicate: Predicate\<A>) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<E, A>\<E, A>(logger: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<E, A>) => (predicate: Predicate\<A>) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<E, A> = curry(loggerM.filter) as { \<E, A>(logger: LoggerEffect\<E, A>, predicate: Predicate\<A>): LoggerEffect\<E, A> \<E, A>(logger: LoggerEffect\<E, A>): (predicate: Predicate\<A>) => LoggerEffect\<E, A>}

*Defined in [src/logging/LoggerEffect.ts:27](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L27)*

Filter a LoggerEffect

___

### getMonoid

• `Const` **getMonoid**: \<E, A>() => Monoid\<[LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<E, A>> = loggerM.getMonoid

*Defined in [src/logging/LoggerEffect.ts:35](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L35)*

Create a Monoid instance for LoggerEffect

___

### loggerM

• `Const` **loggerM**: LoggerM2\<\"@typed/fp/Effect\"> = getLoggerM(effect)

*Defined in [src/logging/LoggerEffect.ts:9](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L9)*

## Object literals

### loggerEffect

▪ `Const` **loggerEffect**: object

*Defined in [src/logging/LoggerEffect.ts:40](https://github.com/TylorS/typed-fp/blob/8639976/src/logging/LoggerEffect.ts#L40)*

Contravariant instance for LoggerInstance

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`URI` | \"@typed/fp/logging/LoggerEffect\" | \"@typed/fp/logging/LoggerEffect\" |
`contramap` | function | loggerM.contramap |
