**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "logic/exec"

# Module: "logic/exec"

## Index

### Variables

* [exec](_logic_exec_.md#exec)

## Variables

### exec

• `Const` **exec**: (regex: RegExp, str: string) => Option\<RegExpExecArray>(regex: RegExp) => (str: string) => Option\<RegExpExecArray> = curry((regex: RegExp, str: string): Option\<RegExpExecArray> => fromNullable(regex.exec(str)))

*Defined in [src/logic/exec.ts:4](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/logic/exec.ts#L4)*
