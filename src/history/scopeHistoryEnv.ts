import { ArgsOf } from '@typed/fp/common/exports'
import { Path, pathJoin } from '@typed/fp/Path/exports'
import { parseUri, Uri } from '@typed/fp/Uri/exports'

import { HistoryEnv } from './HistoryEnv'

export function scopeHistoryEnv<A>(
  scope: Path,
  { history, location }: HistoryEnv<A>,
): HistoryEnv<A> {
  const pushState = (...args: ArgsOf<History['pushState']>) =>
    history.pushState(args[0], args[1], Path.unwrap(pathJoin(['/', scope, args[2]])))
  const replaceState = (...args: ArgsOf<History['replaceState']>) =>
    history.replaceState(args[0], args[1], Path.unwrap(pathJoin(['/', scope, args[2]])))
  const back = () => history.back()
  const forward = () => history.forward()
  const go = (amount: number) => history.go(amount)

  const updatedHistory = {
    pushState,
    replaceState,
    back,
    forward,
    go,
    get length() {
      return history.length
    },
    set scrollRestoration(mode: History['scrollRestoration']) {
      history.scrollRestoration = mode
    },
    get scrollRestoration() {
      return history.scrollRestoration
    },
    get state() {
      return history.state
    },
  }

  const updatedLocation: Location = {
    ...location,
    assign: (url) => {
      const { protocol, host, relative } = parseUri(Uri.wrap(url))
      const href = protocol + `//` + host + pathJoin([scope, relative])

      return location.assign(href)
    },
    reload: location.reload.bind(location),
    replace: (url) => {
      const { protocol, host, relative } = parseUri(Uri.wrap(url))
      const href = protocol + `//` + host + pathJoin([scope, relative])

      return location.replace(href)
    },
    get pathname() {
      return location.pathname.replace(Path.unwrap(pathJoin(['/', scope], true)), '')
    },
    set pathname(path: string) {
      location.pathname = Path.unwrap(pathJoin(['/', scope, path]))
    },
  }

  return {
    history: updatedHistory,
    location: updatedLocation,
  }
}
