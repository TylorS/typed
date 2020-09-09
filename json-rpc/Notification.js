import { createGuardFromSchema, createSchema } from '@typed/fp/io';
import { pipe, unsafeCoerce } from 'fp-ts/es6/function';
export const Notification = (schema) => unsafeCoerce(createSchema((t) => pipe(t.type({
    jsonrpc: t.literal('2.0'),
}), t.intersect(schema(t)))));
const DefaultNotification = Notification((t) => t.union(t.type({ method: t.string, params: t.union(t.jsonRecord, t.jsonArray) }), t.type({ method: t.string, params: t.never })));
export const { is: isNotification } = createGuardFromSchema(DefaultNotification);
//# sourceMappingURL=Notification.js.map