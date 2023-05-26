import * as Global from '@effect/data/Global'

const id = '@typed/navigation/ServiceId'

export const ServiceId: any = Global.globalValue(id, () => Symbol.for(id))
