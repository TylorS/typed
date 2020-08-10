import { Uuid, UuidSeed } from '../types'

export function uuid4(seed: UuidSeed): Uuid {
  return ((seed[0].toString(16) +
    seed[1].toString(16) +
    seed[2].toString(16) +
    seed[3].toString(16) +
    '-' +
    seed[4].toString(16) +
    seed[5].toString(16) +
    '-' +
    // tslint:disable-next-line:no-bitwise
    ((seed[6] & 0x0f) | 0x40).toString(16) +
    seed[7].toString(16) +
    '-' +
    // tslint:disable-next-line:no-bitwise
    ((seed[8] & 0xbf) | 0x80).toString(16) +
    seed[9].toString(16) +
    '-' +
    seed[10].toString(16) +
    seed[11].toString(16) +
    seed[12].toString(16) +
    seed[13].toString(16) +
    seed[14].toString(16) +
    seed[15].toString(16)) as any) as Uuid
}
