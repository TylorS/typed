**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "browser/UuidEnv.browser-test"

# Module: "browser/UuidEnv.browser-test"

## Index

### Variables

* [test](_browser_uuidenv_browser_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`browser/UuidEnv\`, [ describe(\`randomUuidSeed\`, [ it(\`returns UuidSeed\`, ({ equal }) => { const seed = uuidEnv.randomUuidSeed() equal(VALID\_UUID\_LENGTH, seed.length) }), ]),])

*Defined in [src/browser/UuidEnv.browser-test.ts:6](https://github.com/TylorS/typed-fp/blob/559f273/src/browser/UuidEnv.browser-test.ts#L6)*
