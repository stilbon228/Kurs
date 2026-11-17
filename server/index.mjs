// Прокси к открытому API «Работа России» (opendata.trudvsem.ru).
// API бесплатный и без ключа; прокси нужен для кэша и единообразного CORS.
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001
const UPSTREAM = 'https://opendata.trudvsem.ru/api/v1'
const CACHE_TTL_MS = 5 * 60 * 1000

const cache = new Map() // url -> { at, status, body }
app.get('/api/*', async (req, res) => {
  const sub = req.params[0] // например "vacancies/region/7700000000000"
  const qs = req.originalUrl.slice(req.originalUrl.indexOf('?') + 1)
  const url = `${UPSTREAM}/${sub}${req.originalUrl.includes('?') ? '?' + qs : ''}`

  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    res.set('X-Cache', 'HIT')
    return res.status(hit.status).json(hit.body)
  }

  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } })
    const body = await upstream.json().catch(() => ({ error: 'bad json from trudvsem' }))
    // Успех кэшируем надолго, ошибки — на 30 секунд, чтобы ретраи не бились в кэш
    if (upstream.status === 200 && !body?.meta?.error) {
      cache.set(url, { at: Date.now(), status: upstream.status, body })
    } else {
      cache.set(url, { at: Date.now() - CACHE_TTL_MS + 30 * 1000, status: upstream.status, body })
    }
    res.set('X-Cache', 'MISS')
    res.status(upstream.status).json(body)
  } catch (e) {
    res.status(502).json({ error: String(e) })
  }
})

// В проде (Render и т.п.) раздаём собранный фронтенд из dist/
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const distDir = fileURLToPath(new URL('../dist', import.meta.url))
if (existsSync(distDir + '/index.html')) {
  app.use(express.static(distDir))
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(distDir + '/index.html')
  })
}

app.listen(PORT, () => {
  console.log(`trudvsem proxy listening on http://localhost:${PORT}`)
})
