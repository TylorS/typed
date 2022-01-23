/**
 * Tracks if a given Fx Context is interruptable.
 */
export class InterruptableStatus {
  private _numOfUninterruptableRegions = 0 // Use a reference count just in case multiple interruptable regions run at the same time
  private _isAskingToInterrupt = false
  private _hasInterrupted = false
  private _listeners: Array<() => void> = []

  get isInterruptable(): boolean {
    return this._numOfUninterruptableRegions === 0
  }

  set isInterruptable(interruptable: boolean) {
    this._numOfUninterruptableRegions = Math.max(
      0,
      this._numOfUninterruptableRegions + (interruptable ? -1 : 1),
    )

    if (this.isInterruptable && this._isAskingToInterrupt) {
      this._hasInterrupted = true
      this._listeners.slice().forEach((r) => r())
      this._listeners = []
    }
  }

  get hasInterrupted(): boolean {
    return this._hasInterrupted
  }

  readonly waitToInterrupt = async (): Promise<void> => {
    if (this.hasInterrupted) {
      return
    }

    if (this.isInterruptable) {
      this._isAskingToInterrupt = true
      this._hasInterrupted = true
    }

    await new Promise<void>((resolve) => {
      this._isAskingToInterrupt = true
      this._listeners.push(resolve)
    })
  }
}
