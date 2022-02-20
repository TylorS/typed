import { Associative } from '../Associative'

export const Sum: Associative<number> = Associative((x, y) => x + y)

export const Product: Associative<number> = Associative((x, y) => x * y)
