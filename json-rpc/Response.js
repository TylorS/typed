import { createGuardFromSchema, createSchema } from '@typed/fp/io';
import { pipe } from 'fp-ts/es6/function';
import { Id } from './Id';
export const Response = (success, failure) => createSchema((t) => t.union(SuccessfulResponse(success)(t), FailedResponse(failure)(t)));
const DefaultResponse = createSchema((t) => t.union(DefaultSuccessfulResponse(t), DefaultFailedResponse(t)));
export const { is: isResponse } = createGuardFromSchema(DefaultResponse);
export const SuccessfulResponse = (schema) => createSchema((t) => pipe(t.type({
    jsonrpc: t.literal('2.0'),
    id: Id(t),
}), t.intersect(schema(t))));
const DefaultSuccessfulResponse = SuccessfulResponse((t) => t.union(t.type({ result: t.union(t.jsonRecord, t.jsonArray) }), t.type({ result: t.never })));
export const { is: isSuccessfulResponse, } = createGuardFromSchema(DefaultSuccessfulResponse);
export const FailedResponse = (schema) => createSchema((t) => pipe(t.type({
    jsonrpc: t.literal('2.0'),
    id: Id(t),
}), t.intersect(schema(t))));
const DefaultFailedResponse = FailedResponse((t) => t.union(t.type({
    error: t.type({
        code: t.number,
        message: t.string,
        data: t.json,
    }),
}), t.type({
    error: t.type({
        code: t.number,
        message: t.string,
        data: t.never,
    }),
})));
export const { is: isFailedResponse, } = createGuardFromSchema(DefaultFailedResponse);
//# sourceMappingURL=Response.js.map