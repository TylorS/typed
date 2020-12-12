import { describe, given, it } from '@typed/test'
import { make as makeConst } from 'fp-ts/Const'
import { pipe } from 'fp-ts/function'
import { make } from 'io-ts/Schema'

import { createInterpreter } from './interpreter'
import { Schemable } from './JsonSchema'

export const test = describe.only(`io/JsonSchema`, [
  given(`Schema`, [
    it(`outputs expected JsonSchema`, ({ equal }) => {
      const mySchema = make((t) =>
        pipe(
          t.type({ id: t.number, name: t.string }),
          t.intersect(
            t.partial({
              displayName: t.string,
            }),
          ),
        ),
      )

      const createJsonSchema = createInterpreter(Schemable)
      const myJsonSchema = createJsonSchema(mySchema)
      const actual = myJsonSchema.createSchema({})
      const expected = makeConst<Omit<typeof actual, '_A'>>({
        allOf: [
          {
            type: 'object',
            properties: {
              id: {
                type: 'number',
              },
              name: {
                type: 'string',
              },
            },
            required: ['id', 'name'],
          },
          {
            type: 'object',
            properties: {
              displayName: {
                type: 'string',
              },
            },
          },
        ],
      })

      equal(expected, actual)
    }),
  ]),
])
