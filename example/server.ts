import * as S from 'virtual:server-entry'

if (import.meta.env.PROD) {
  S.app.use(
    S.staticGzip({
      serveStatic: { maxAge: 31536000, cacheControl: true },
    }),
  )
}

S.app.get('*', S.requestHandler)

S.listen(3000, () => {
  console.log('Server listening on port 3000')
})
