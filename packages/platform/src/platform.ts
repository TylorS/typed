export interface Platform {
  readonly nextId: () => number
  readonly fork: () => Platform
}

export function Platform(): Platform {
  let id = 0

  const platform: Platform = {
    nextId: () => id++,
    fork: () => ForkPlatform(platform),
  }

  return platform
}

function ForkPlatform(platform: Platform): Platform {
  return {
    nextId: platform.nextId,
    fork: () => ForkPlatform(platform),
  }
}
