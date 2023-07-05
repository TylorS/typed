import { Handler } from './Handler.js'
import { Op } from './Op.js'
import { Stack } from './Stack.js'

export class Handlers {
  constructor(private map: Map<any, Stack<Handler.Any>> = new Map()) {}

  clone(): Handlers {
    return new Handlers(new Map(this.map))
  }

  push(handler: Handler.Any) {
    const previousHandlers = this.map.get(handler.op.key) || null

    this.map.set(handler.op.key, new Stack(handler, previousHandlers))
  }

  pop(handler: Handler.Any) {
    const handlers = this.map.get(handler.op.key)

    let currentHandler: Handler.Any | null = null

    if (handlers) {
      const current = handlers.value

      if (handlers.previous) {
        this.map.set(handler.op.key, handlers.previous)
      } else {
        this.map.delete(handler.op.key)
      }

      currentHandler = current
    }

    return currentHandler
  }

  find(op: Op.Any) {
    const current = this.map.get(op.key)

    if (current) {
      return current.value
    }

    return null
  }
}
