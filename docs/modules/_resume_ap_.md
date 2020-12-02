**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Resume/ap"

# Module: "Resume/ap"

## Index

### Variables

* [ap](_resume_ap_.md#ap)

## Variables

### ap

• `Const` **ap**: \<A, B>(fn: [Sync](../interfaces/_resume_sync_.sync.md)\<[Arity1](_common_types_.md#arity1)\<A, B>>, value: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>\<A, B>(fn: [Async](../interfaces/_resume_async_.async.md)\<[Arity1](_common_types_.md#arity1)\<A, B>>, value: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>\<A, B>(fn: [Resume](_resume_resume_.md#resume)\<[Arity1](_common_types_.md#arity1)\<A, B>>, value: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(fn: [Sync](../interfaces/_resume_sync_.sync.md)\<[Arity1](_common_types_.md#arity1)\<A, B>>) => (value: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>(value: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(fn: [Async](../interfaces/_resume_async_.async.md)\<[Arity1](_common_types_.md#arity1)\<A, B>>) => (value: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>(value: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(fn: [Resume](_resume_resume_.md#resume)\<[Arity1](_common_types_.md#arity1)\<A, B>>) => (value: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B> = curry( \<A, B>(fn: Resume\<Arity1\<A, B>>, value: Resume\<A>): Resume\<B> => { if (!fn.async && !value.async) { return sync(fn.value(value.value)) } return async((cb) => { let f: Option\<Arity1\<A, B>> = none let v: Option\<A> = none const onValue = () => { if (isNone(f) \|\| isNone(v)) { return disposeNone() } return cb(f.value(v.value)) } return disposeBoth( run(fn, (ab) => { f = some(ab) return onValue() }), run(value, (a) => { v = some(a) return onValue() }), ) }) },) as { \<A, B>(fn: Sync\<Arity1\<A, B>>, value: Sync\<A>): Sync\<B> \<A, B>(fn: Async\<Arity1\<A, B>>, value: Async\<A>): Async\<B> \<A, B>(fn: Resume\<Arity1\<A, B>>, value: Resume\<A>): Resume\<B> \<A, B>(fn: Sync\<Arity1\<A, B>>): { (value: Sync\<A>): Sync\<B> (value: Resume\<A>): Resume\<B> } \<A, B>(fn: Async\<Arity1\<A, B>>): { (value: Async\<A>): Async\<B> (value: Resume\<A>): Resume\<B> } \<A, B>(fn: Resume\<Arity1\<A, B>>): (value: Resume\<A>) => Resume\<B>}

*Defined in [src/Resume/ap.ts:14](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Resume/ap.ts#L14)*

Apply the function to a value contained within Resume's.
