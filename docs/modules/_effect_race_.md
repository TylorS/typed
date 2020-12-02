**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "Effect/race"

# Module: "Effect/race"

## Index

### Variables

* [race](_effect_race_.md#race)

## Variables

### race

• `Const` **race**: \<E1, A, E2, B>(a: [Effect](_effect_effect_.effect.md)\<E1, A>, b: [Effect](_effect_effect_.effect.md)\<E2, B>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, A \| B>\<E1, A>(a: [Effect](_effect_effect_.effect.md)\<E1, A>) => \<E2, B>(b: [Effect](_effect_effect_.effect.md)\<E2, B>) => [Effect](_effect_effect_.effect.md)\<E1 & E2, A \| B> = curry( \<E1, A, E2, B>(a: Effect\<E1, A>, b: Effect\<E2, B>): Effect\<E1 & E2, A \| B> => fromEnv((e) => { const aResume = toEnv(a)(e) const bResume = toEnv(b)(e) if (!aResume.async) { return aResume } if (!bResume.async) { return bResume } return async((resume) => { const disposable = lazy() function cb(value: A \| B, dispose: () => void): Disposable { if (disposable.disposed) { return disposeNone() } dispose() return resume(value) } const bDisposableLazy = lazy() const aDisposable = run(aResume, (a) => cb(a, () => bDisposableLazy.dispose())) bDisposableLazy.addDisposable(run(bResume, (b) => cb(b, () => aDisposable.dispose()))) disposable.addDisposable(disposeBoth(aDisposable, bDisposableLazy)) return disposable }) }),) as { \<E1, A, E2, B>(a: Effect\<E1, A>, b: Effect\<E2, B>): Effect\<E1 & E2, A \| B> \<E1, A>(a: Effect\<E1, A>): \<E2, B>(b: Effect\<E2, B>) => Effect\<E1 & E2, A \| B>}

*Defined in [src/Effect/race.ts:11](https://github.com/TylorS/typed-fp/blob/ac98ca1/src/Effect/race.ts#L11)*

Race two Effects together.
