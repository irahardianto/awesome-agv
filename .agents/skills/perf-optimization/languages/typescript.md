# TypeScript / Node.js Performance Profiling

> **Applicability:** Server-side TypeScript (Node.js, Deno, Bun). For browser/frontend performance, see `frontend.md` which covers bundle size, rendering, and Core Web Vitals.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| Node.js `--prof` | V8 CPU profile | `node --prof dist/server.js` then `node --prof-process isolate-*.log` |
| `--inspect` + Chrome DevTools | Interactive CPU/memory profiling | `node --inspect dist/server.js` → chrome://inspect |
| `clinic doctor` | Diagnose event loop, I/O, GC issues | `npx clinic doctor -- node dist/server.js` |
| `clinic flame` | Flamegraph generation | `npx clinic flame -- node dist/server.js` |
| `clinic bubbleprof` | Async operation visualization | `npx clinic bubbleprof -- node dist/server.js` |
| `0x` | Flamegraph from V8 stack samples | `npx 0x dist/server.js` |
| `autocannon` | HTTP load testing | `npx autocannon -c 100 -d 30 http://localhost:3000/api/tasks` |
| `heapdump` | Heap snapshot to file | `require('heapdump').writeSnapshot('./heap.heapsnapshot')` |
| `memlab` | Automated memory leak detection | `npx memlab run --scenario scenario.js` |

---

## Optimization Patterns

### Pattern: Event Loop Offloading

**Symptom:** `clinic doctor` shows event loop delay > 20ms. Server response times spike under load.

**Root cause:** CPU-intensive synchronous code blocking the event loop.

```typescript
// ❌ Blocks event loop — all requests stall
app.get('/api/report', (req, res) => {
  const result = computeHeavyReport(data); // 500ms sync computation
  res.json(result);
});

// ✅ Offload to worker thread
import { Worker } from 'worker_threads';

app.get('/api/report', async (req, res) => {
  const result = await runInWorker('./workers/report.js', data);
  res.json(result);
});

// ✅ Alternative: use piscina thread pool
import Piscina from 'piscina';
const pool = new Piscina({ filename: './workers/report.js' });

app.get('/api/report', async (req, res) => {
  const result = await pool.run(data);
  res.json(result);
});
```

### Pattern: Stream Processing

**Symptom:** High memory usage when processing large datasets. Heap grows to GB before GC.

```typescript
// ❌ Loads entire file into memory
const data = await fs.readFile('large-file.json', 'utf-8');
const records = JSON.parse(data); // 2GB string + 2GB parsed object

// ✅ Stream processing — constant memory
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import JSONStream from 'jsonstream2';

await pipeline(
  createReadStream('large-file.json'),
  JSONStream.parse('*'),
  async function* (source) {
    for await (const record of source) {
      yield processRecord(record);
    }
  },
  createWriteStream('output.jsonl'),
);
```

### Pattern: Connection Pooling

**Symptom:** Database latency increases under load. Connection establishment dominates query time.

```typescript
// ❌ New connection per query
async function getTask(id: string): Promise<Task> {
  const client = new Client(connectionString);
  await client.connect();
  const result = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
  await client.end();
  return result.rows[0];
}

// ✅ Connection pool — connections reused
import { Pool } from 'pg';
const pool = new Pool({
  connectionString,
  max: 20,           // Max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function getTask(id: string): Promise<Task> {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return result.rows[0];
}
```

### Pattern: Response Caching

**Symptom:** Same expensive queries repeated for identical requests. Database load scales linearly with traffic.

```typescript
// ✅ In-memory cache with TTL
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, Task[]>({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
});

async function getTasks(userId: string): Promise<Task[]> {
  const cached = cache.get(userId);
  if (cached) return cached;

  const tasks = await db.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
  cache.set(userId, tasks);
  return tasks;
}
```

### Pattern: JSON Serialization Optimization

**Symptom:** High CPU in JSON.stringify/parse. Large API responses taking significant serialization time.

```typescript
// ✅ Use fast-json-stringify for known schemas
import fastJson from 'fast-json-stringify';

const stringify = fastJson({
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    priority: { type: 'string' },
  },
});

// 2-5x faster than JSON.stringify for known schemas
const json = stringify(task);
```

---

## Anti-Patterns

1. **Don't block the event loop** — any synchronous operation >10ms should be offloaded to a worker thread.
2. **Don't use `JSON.parse` for large files** — stream with JSONStream or use `fast-json-stringify`.
3. **Don't create connections per request** — use connection pools (`pg.Pool`, `ioredis`, etc.).
4. **Don't buffer entire responses in memory** — stream large responses with `res.write()`.
5. **Don't ignore GC pressure** — frequent GC pauses indicate excessive short-lived object allocation.
6. **Don't use `process.memoryUsage()` as the sole metric** — it shows RSS, not actual leak. Use heap snapshots for leak diagnosis.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| Event loop tick | ~1ms | V8 scheduler overhead |
| `JSON.stringify` (small object) | ~1μs | Serialization has inherent cost |
| TCP connection establishment | ~1ms local, 50-200ms remote | Network round trip |
| TLS handshake | 2-5ms local | Cryptographic operations |
| V8 JIT compilation | First-call latency | JIT warms up over time |
| GC pause (minor) | 1-5ms | Generational GC overhead |
| Worker thread spawn | ~5ms | OS thread creation |

---

## Benchmarking

```typescript
// Vitest bench
import { bench, describe } from 'vitest';

describe('serialization', () => {
  bench('JSON.stringify', () => {
    JSON.stringify(largeObject);
  });

  bench('fast-json-stringify', () => {
    fastStringify(largeObject);
  });
});

// Run: npx vitest bench
```

```bash
# HTTP benchmarking with autocannon
npx autocannon -c 100 -d 30 -p 10 http://localhost:3000/api/tasks
# -c: connections, -d: duration (seconds), -p: pipelining
```

---

## Related
- TypeScript Idioms @typescript-idioms-and-patterns.md
- Frontend Performance @frontend.md (browser-side optimization)
- Performance Optimization SKILL @../SKILL.md
