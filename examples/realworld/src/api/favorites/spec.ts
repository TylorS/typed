import { security } from "@/api/common/security"
import { Api } from "effect-http"
import * as Routes from "./routes"

export const FavoritesSpec = Api.apiGroup("Favorites").pipe(
  Api.post(
    "favorite",
    Routes.favorites.path,
    {
      request: {
        params: Routes.favorites.schema
      }
    },
    {
      security
    }
  ),
  Api.delete(
    "unfavorite",
    Routes.favorites.path,
    {
      request: {
        params: Routes.favorites.schema
      }
    },
    {
      security
    }
  )
)
