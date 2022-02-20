import { Associative } from '../Associative'

export const All: Associative<boolean> = Associative((x, y) => x && y)

export const Any: Associative<boolean> = Associative((x, y) => x || y)
