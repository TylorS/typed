**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "node/HistoryEnv/createHistoryEnv.test"

# Module: "node/HistoryEnv/createHistoryEnv.test"

## Index

### Variables

* [test](_node_historyenv_createhistoryenv_test_.md#test)

## Variables

### test

• `Const` **test**: Test = describe(\`createHistoryEnv\`, [ it(\`returns Env with '/' as default location.pathname\`, ({ equal }) => { const { location } = createHistoryEnv() equal('/', location.pathname) }), given(\`an href\`, [ it(\`returns { history: History, location: Location }\`, ({ equal }) => { const { location, history } = createHistoryEnv(Uri.wrap('http://www.example.com')) history.pushState(null, '', '/example') equal('http://www.example.com', location.origin) equal('80', location.port) equal('/example', location.pathname) equal('http:', location.protocol) }), ]), describe(\`History\`, [ describe(\`pushState\`, [ given(\`an href with a different protocol\`, [ it(\`updates the location correctly\`, ({ equal }) => { const { location, history } = createHistoryEnv(Uri.wrap('https://www.example.com')) const href = 'http://www.example.com' history.pushState(void 0, '', href) equal(href, location.href) }), ]), ]), ]),])

*Defined in [src/node/HistoryEnv/createHistoryEnv.test.ts:6](https://github.com/TylorS/typed-fp/blob/8639976/src/node/HistoryEnv/createHistoryEnv.test.ts#L6)*
