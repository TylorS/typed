import { createGuardFromSchema, createSchema } from '@typed/fp/io';
import { pipe, unsafeCoerce } from 'fp-ts/es6/function';
import { Id } from './Id';
export const Request = (schema) => unsafeCoerce(createSchema((t) => pipe(t.type({
    jsonrpc: t.literal('2.0'),
    id: Id(t),
}), t.intersect(schema(t)))));
const DefaultRequest = Request((t) => t.union(t.type({
    method: t.string,
    params: t.union(t.jsonRecord, t.jsonArray),
}), t.type({
    method: t.string,
    params: t.never,
})));
export const { is: isRequest } = createGuardFromSchema(DefaultRequest);
//# sourceMappingURL=Request.js.map