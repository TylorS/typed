import { HttpApiGroup } from "@typed/server"

export const Profiles = HttpApiGroup.make("Profiles")

export const ProfilesApi = HttpApiGroup.build(Profiles, (handlers) => handlers)
