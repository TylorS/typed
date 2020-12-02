**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Console/exports"

# Module: "Console/exports"

## Index

### Interfaces

* [ConsoleEnv](../interfaces/_console_exports_.consoleenv.md)

### Variables

* [clear](_console_exports_.md#clear)
* [count](_console_exports_.md#count)
* [createConsoleLogger](_console_exports_.md#createconsolelogger)
* [createCountLogger](_console_exports_.md#createcountlogger)
* [createDebugLogger](_console_exports_.md#createdebuglogger)
* [createDirLogger](_console_exports_.md#createdirlogger)
* [createDirXmlLogger](_console_exports_.md#createdirxmllogger)
* [createErrorLogger](_console_exports_.md#createerrorlogger)
* [createExceptionLogger](_console_exports_.md#createexceptionlogger)
* [createGroupCollapsedLogger](_console_exports_.md#creategroupcollapsedlogger)
* [createGroupLogger](_console_exports_.md#creategrouplogger)
* [createInfoLogger](_console_exports_.md#createinfologger)
* [createLogLogger](_console_exports_.md#createloglogger)
* [createTimeEndLogger](_console_exports_.md#createtimeendlogger)
* [createTimeLogLogger](_console_exports_.md#createtimeloglogger)
* [createTimeLogger](_console_exports_.md#createtimelogger)
* [createTimeStampLogger](_console_exports_.md#createtimestamplogger)
* [createTraceLogger](_console_exports_.md#createtracelogger)
* [createWarnLogger](_console_exports_.md#createwarnlogger)
* [debug](_console_exports_.md#debug)
* [dir](_console_exports_.md#dir)
* [dirXml](_console_exports_.md#dirxml)
* [error](_console_exports_.md#error)
* [exception](_console_exports_.md#exception)
* [group](_console_exports_.md#group)
* [groupCollapsed](_console_exports_.md#groupcollapsed)
* [groupEnd](_console_exports_.md#groupend)
* [info](_console_exports_.md#info)
* [log](_console_exports_.md#log)
* [time](_console_exports_.md#time)
* [timeEnd](_console_exports_.md#timeend)
* [timeLog](_console_exports_.md#timelog)
* [timeStamp](_console_exports_.md#timestamp)
* [trace](_console_exports_.md#trace)
* [warn](_console_exports_.md#warn)

### Functions

* [assert](_console_exports_.md#assert)
* [withConsole](_console_exports_.md#withconsole)

## Variables

### clear

• `Const` **clear**: [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), void> = withConsole((c) => c.clear())

*Defined in [src/Console/exports.ts:35](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L35)*

Clear the console.

___

### count

• `Const` **count**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createCountLogger(showString)

*Defined in [src/Console/exports.ts:135](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L135)*

Use console.count from ConsoleEnv to log a message

___

### createConsoleLogger

• `Const` **createConsoleLogger**: \<A>(type: keyof Console, \_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A>(type: keyof Console) => \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = curry( \<A>(type: keyof Console, { show }: Show\<A>): LoggerEffect\<ConsoleEnv, A> => (a) => withConsole((c) => c[type](show(a))),) as { \<A>(type: keyof Console, { show }: Show\<A>): LoggerEffect\<ConsoleEnv, A> (type: keyof Console): \<A>({ show }: Show\<A>) => LoggerEffect\<ConsoleEnv, A>}

*Defined in [src/Console/exports.ts:24](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L24)*

Creates a LoggerEffect using Console and a Show<A> instance to determine the
payload type.

___

### createCountLogger

• `Const` **createCountLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('count')

*Defined in [src/Console/exports.ts:53](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L53)*

Provide a Show instance to create a console.count LoggerEffect

___

### createDebugLogger

• `Const` **createDebugLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('debug')

*Defined in [src/Console/exports.ts:58](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L58)*

Provide a Show instance to create a console.debug LoggerEffect

___

### createDirLogger

• `Const` **createDirLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('dir')

*Defined in [src/Console/exports.ts:63](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L63)*

Provide a Show instance to create a console.dir LoggerEffect

___

### createDirXmlLogger

• `Const` **createDirXmlLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('dirxml')

*Defined in [src/Console/exports.ts:68](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L68)*

Provide a Show instance to create a console.dirxml LoggerEffect

___

### createErrorLogger

• `Const` **createErrorLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('error')

*Defined in [src/Console/exports.ts:73](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L73)*

Provide a Show instance to create a console.error LoggerEffect

___

### createExceptionLogger

• `Const` **createExceptionLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('exception')

*Defined in [src/Console/exports.ts:78](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L78)*

Provide a Show instance to create a console.exception LoggerEffect

___

### createGroupCollapsedLogger

• `Const` **createGroupCollapsedLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('groupCollapsed')

*Defined in [src/Console/exports.ts:88](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L88)*

Provide a Show instance to create a console.groupCollapsed LoggerEffect

___

### createGroupLogger

• `Const` **createGroupLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('group')

*Defined in [src/Console/exports.ts:83](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L83)*

Provide a Show instance to create a console.group LoggerEffect

___

### createInfoLogger

• `Const` **createInfoLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('info')

*Defined in [src/Console/exports.ts:93](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L93)*

Provide a Show instance to create a console.info LoggerEffect

___

### createLogLogger

• `Const` **createLogLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('log')

*Defined in [src/Console/exports.ts:98](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L98)*

Provide a Show instance to create a console.log LoggerEffect

___

### createTimeEndLogger

• `Const` **createTimeEndLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('timeEnd')

*Defined in [src/Console/exports.ts:108](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L108)*

Provide a Show instance to create a console.timeEnd LoggerEffect

___

### createTimeLogLogger

• `Const` **createTimeLogLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('timeLog')

*Defined in [src/Console/exports.ts:113](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L113)*

Provide a Show instance to create a console.timeLog LoggerEffect

___

### createTimeLogger

• `Const` **createTimeLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('time')

*Defined in [src/Console/exports.ts:103](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L103)*

Provide a Show instance to create a console.time LoggerEffect

___

### createTimeStampLogger

• `Const` **createTimeStampLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('timeStamp')

*Defined in [src/Console/exports.ts:118](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L118)*

Provide a Show instance to create a console.timeStamp LoggerEffect

___

### createTraceLogger

• `Const` **createTraceLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('trace')

*Defined in [src/Console/exports.ts:123](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L123)*

Provide a Show instance to create a console.trace LoggerEffect

___

### createWarnLogger

• `Const` **createWarnLogger**: \<A>(\_\_namedParameters: { show: (a: A) => string  }) => [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A> = createConsoleLogger('warn')

*Defined in [src/Console/exports.ts:128](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L128)*

Provide a Show instance to create a console.warn LoggerEffect

___

### debug

• `Const` **debug**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createDebugLogger(showString)

*Defined in [src/Console/exports.ts:140](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L140)*

Use console.debug from ConsoleEnv to log a message

___

### dir

• `Const` **dir**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createDirLogger(showString)

*Defined in [src/Console/exports.ts:145](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L145)*

Use console.dir from ConsoleEnv to log a message

___

### dirXml

• `Const` **dirXml**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createDirXmlLogger(showString)

*Defined in [src/Console/exports.ts:150](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L150)*

Use console.dirXml from ConsoleEnv to log a message

___

### error

• `Const` **error**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createErrorLogger(showString)

*Defined in [src/Console/exports.ts:155](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L155)*

Use console.error from ConsoleEnv to log a message

___

### exception

• `Const` **exception**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createExceptionLogger(showString)

*Defined in [src/Console/exports.ts:160](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L160)*

Use console.exception from ConsoleEnv to log a message

___

### group

• `Const` **group**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createGroupLogger(showString)

*Defined in [src/Console/exports.ts:165](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L165)*

Use console.group from ConsoleEnv to log a message

___

### groupCollapsed

• `Const` **groupCollapsed**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createInfoLogger(showString)

*Defined in [src/Console/exports.ts:170](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L170)*

Use console.groupCollapsed from ConsoleEnv to log a message

___

### groupEnd

• `Const` **groupEnd**: [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), void> = withConsole((c) => c.groupEnd())

*Defined in [src/Console/exports.ts:46](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L46)*

End the current group

___

### info

• `Const` **info**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createInfoLogger(showString)

*Defined in [src/Console/exports.ts:175](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L175)*

Use console.info from ConsoleEnv to log a message

___

### log

• `Const` **log**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createLogLogger(showString)

*Defined in [src/Console/exports.ts:180](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L180)*

Use console.log from ConsoleEnv to log a message

___

### time

• `Const` **time**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createTimeLogger(showString)

*Defined in [src/Console/exports.ts:185](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L185)*

Use console.time from ConsoleEnv to log a message

___

### timeEnd

• `Const` **timeEnd**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createTimeEndLogger(showString)

*Defined in [src/Console/exports.ts:190](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L190)*

Use console.timeEnd from ConsoleEnv to log a message

___

### timeLog

• `Const` **timeLog**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createTimeLogLogger(showString)

*Defined in [src/Console/exports.ts:195](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L195)*

Use console.timeLog from ConsoleEnv to log a message

___

### timeStamp

• `Const` **timeStamp**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createTimeStampLogger(showString)

*Defined in [src/Console/exports.ts:200](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L200)*

Use console.timeStamp from ConsoleEnv to log a message

___

### trace

• `Const` **trace**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createTraceLogger(showString)

*Defined in [src/Console/exports.ts:205](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L205)*

Use console.trace from ConsoleEnv to log a message

___

### warn

• `Const` **warn**: [LoggerEffect](../interfaces/_logging_loggereffect_.loggereffect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), string> = createWarnLogger(showString)

*Defined in [src/Console/exports.ts:210](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L210)*

Use console.warm from ConsoleEnv to log a message

## Functions

### assert

▸ `Const`**assert**(`condition?`: undefined \| false \| true, ...`data`: readonly any[]): [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), void>

*Defined in [src/Console/exports.ts:40](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L40)*

Assert a condition using the Console API.

#### Parameters:

Name | Type |
------ | ------ |
`condition?` | undefined \| false \| true |
`...data` | readonly any[] |

**Returns:** [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), void>

___

### withConsole

▸ `Const`**withConsole**\<A>(`f`: (c: Console) => A): [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A>

*Defined in [src/Console/exports.ts:17](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Console/exports.ts#L17)*

Perform a synchronous effect using the Console

#### Type parameters:

Name |
------ |
`A` |

#### Parameters:

Name | Type |
------ | ------ |
`f` | (c: Console) => A |

**Returns:** [Effect](_effect_effect_.effect.md)\<[ConsoleEnv](../interfaces/_console_exports_.consoleenv.md), A>
