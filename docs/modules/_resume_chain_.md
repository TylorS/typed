**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Resume/chain"

# Module: "Resume/chain"

## Index

### Variables

* [chain](_resume_chain_.md#chain)

## Variables

### chain

• `Const` **chain**: \<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Sync](../interfaces/_resume_sync_.sync.md)\<B>>, resume: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Async](../interfaces/_resume_async_.async.md)\<B>>, resume: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Resume](_resume_resume_.md#resume)\<B>>, resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Sync](../interfaces/_resume_sync_.sync.md)\<B>>) => (resume: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>(resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Async](../interfaces/_resume_async_.async.md)\<B>>) => (resume: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>(resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(f: [Arity1](_common_types_.md#arity1)\<A, [Resume](_resume_resume_.md#resume)\<B>>) => (resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B> = curry( \<A, B>(f: Arity1\<A, Resume\<B>>, resume: Resume\<A>): Resume\<B> => { return resume.async ? async((cb) => run(resume, (a) => run(f(a), cb))) : f(resume.value) },) as { \<A, B>(f: Arity1\<A, Sync\<B>>, resume: Sync\<A>): Sync\<B> \<A, B>(f: Arity1\<A, Async\<B>>, resume: Async\<A>): Async\<B> \<A, B>(f: Arity1\<A, Resume\<B>>, resume: Resume\<A>): Resume\<B> \<A, B>(f: Arity1\<A, Sync\<B>>): { (resume: Sync\<A>): Sync\<B> (resume: Resume\<A>): Resume\<B> } \<A, B>(f: Arity1\<A, Async\<B>>): { (resume: Async\<A>): Async\<B> (resume: Resume\<A>): Resume\<B> } \<A, B>(f: Arity1\<A, Resume\<B>>): (resume: Resume\<A>) => Resume\<B>}

*Defined in [src/Resume/chain.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Resume/chain.ts#L12)*

Sequence together multiple Resumes.
