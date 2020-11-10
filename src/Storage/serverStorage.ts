import { proxyStorage } from './proxyStorage'

/**
 * Create an in-memory implementation of Storage
 * @param map Map string string - Initial values
 * @returns Storage
 */
export function serverStorage(map?: Map<string, string>): Storage {
  return proxyStorage(new ServerStorage(map))
}

class ServerStorage implements Storage {
  public map: Map<string, string>

  constructor(map?: Map<string, string>) {
    this.map = map || new Map<string, string>()
  }

  public get length(): number {
    return this.map.size
  }

  public clear(): void {
    this.map.clear()
  }

  public setItem(key: string, value: string) {
    this.map.set(key, value)
  }

  public getItem(key: string): string | null {
    return this.map.get(key) || null
  }

  public key(index: number): string | null {
    const values = Array.from(this.map.keys())

    return values[index] || null
  }

  public removeItem(key: string) {
    this.map.delete(key)
  }
}
