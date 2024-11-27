import { handleMiddleware } from 'hono/cloudflare-pages'

export const onRequest = handleMiddleware(async (c, next) => {
    console.log(`You are accessing ${c.req.url}`)
    await next()
})