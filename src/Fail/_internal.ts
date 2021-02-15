export const keyValue = <K extends PropertyKey, V>(key: K, value: V): Readonly<Record<K, V>> =>
  ({
    [key]: value,
  } as Readonly<Record<K, V>>)
