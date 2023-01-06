/// <reference types="@typed/vite-plugin" />

// App here is "just" an express app, use it as you would any other express app.
import { app, staticGzip, requestHandler, listen } from 'virtual:server-entry:./pages'

// Serve static files with express server
if (import.meta.env.PROD) {
  app.use(
    staticGzip({
      serveStatic: { maxAge: 31536000, cacheControl: true },
    }),
  )
}

// Register our request handler
app.get('*', requestHandler)

// Start the server, uses vite's http server for development
listen(3000, () => console.log('Server listening on port 3000'))
