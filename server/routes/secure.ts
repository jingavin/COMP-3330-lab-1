// server/routes/secure.ts
import { Hono } from 'hono'
import { requireAuth } from '../auth/requireAuth'
type User = Awaited<ReturnType<typeof import('../auth/kinde').kindeClient.getUserProfile>>

export const secureRoute = new Hono<{ Variables: { user: User } }>()
  .get('/profile', async (c) => {
    const err = await requireAuth(c)
    if (err) return err
    const user = c.get('user')
    return c.json({ user })
  })