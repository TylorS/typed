# @fp/Future

```typescript
import { Either } from 'fp-ts/Either'

export interface Future<E, A, B> extends Effect<E, Either<A, B>> {}
```

A `fp-ts` Monad + Alt Instance and helpers for Effects that return an `fp-ts`' `Either`.
