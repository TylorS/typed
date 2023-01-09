declare module 'vavite/vite-dev-server' {
  import { ViteDevServer } from 'vite'
  const viteDevServer: ViteDevServer | undefined

  export default viteDevServer
}

declare module 'vavite/http-dev-server' {
  import { Server } from 'http'

  const httpServer: Server | undefined

  export default httpServer
}
