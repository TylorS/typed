**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "browser/HistoryEnv"

# Module: "browser/HistoryEnv"

## Index

### Variables

* [provideHistoryEnv](_browser_historyenv_.md#providehistoryenv)

### Object literals

* [historyEnv](_browser_historyenv_.md#historyenv)

## Variables

### provideHistoryEnv

• `Const` **provideHistoryEnv**: [Provider](_effect_provide_.md#provider)\<[HistoryEnv](../interfaces/_history_historyenv_.historyenv.md)> = provideSome\<HistoryEnv>(historyEnv)

*Defined in [src/browser/HistoryEnv.ts:15](https://github.com/TylorS/typed-fp/blob/559f273/src/browser/HistoryEnv.ts#L15)*

Provide an Effect with a browser implementation of HistoryEnv

## Object literals

### historyEnv

▪ `Const` **historyEnv**: object

*Defined in [src/browser/HistoryEnv.ts:7](https://github.com/TylorS/typed-fp/blob/559f273/src/browser/HistoryEnv.ts#L7)*

Browser implementation of HistoryEnv. Uses the native History and Location APIs.

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`history` | History | History |
`location` | Location | Location |
