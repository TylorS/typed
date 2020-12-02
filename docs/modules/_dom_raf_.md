**[@typed/fp](../README.md)**

> [Globals](../globals.md) / "dom/raf"

# Module: "dom/raf"

## Index

### Interfaces

* [RafEnv](../interfaces/_dom_raf_.rafenv.md)

### Variables

* [raf](_dom_raf_.md#raf)

## Variables

### raf

• `Const` **raf**: [Effect](_effect_effect_.effect.md)\<[RafEnv](../interfaces/_dom_raf_.rafenv.md), number> = fromEnv((e: RafEnv) => async\<number>((resume) => { const disposable = lazy() const handle = e.requestAnimationFrame((n) => disposable.addDisposable(resume(n))) disposable.addDisposable({ dispose: () => e.cancelAnimationFrame(handle), }) return disposable }),)

*Defined in [src/dom/raf.ts:16](https://github.com/TylorS/typed-fp/blob/f27ba3e/src/dom/raf.ts#L16)*

An effect for waiting until the next animation frame.
