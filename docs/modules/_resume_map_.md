**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Resume/map"

# Module: "Resume/map"

## Index

### Variables

* [map](_resume_map_.md#map)

## Variables

### map

• `Const` **map**: \<A, B>(f: (value: A) => B, resume: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>\<A, B>(f: (value: A) => B, resume: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>\<A, B>(f: (value: A) => B, resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B>\<A, B>(f: (value: A) => B) => (resume: [Sync](../interfaces/_resume_sync_.sync.md)\<A>) => [Sync](../interfaces/_resume_sync_.sync.md)\<B>(resume: [Async](../interfaces/_resume_async_.async.md)\<A>) => [Async](../interfaces/_resume_async_.async.md)\<B>(resume: [Resume](_resume_resume_.md#resume)\<A>) => [Resume](_resume_resume_.md#resume)\<B> = curry( \<A, B>(f: (value: A) => B, resume: Resume\<A>): Resume\<B> => chain(flow(f, sync), resume),) as { \<A, B>(f: (value: A) => B, resume: Sync\<A>): Sync\<B> \<A, B>(f: (value: A) => B, resume: Async\<A>): Async\<B> \<A, B>(f: (value: A) => B, resume: Resume\<A>): Resume\<B> \<A, B>(f: (value: A) => B): { (resume: Sync\<A>): Sync\<B> (resume: Async\<A>): Async\<B> (resume: Resume\<A>): Resume\<B> }}

*Defined in [src/Resume/map.ts:12](https://github.com/TylorS/typed-fp/blob/f129829/src/Resume/map.ts#L12)*

Apply a function to a Resume's valeu.
