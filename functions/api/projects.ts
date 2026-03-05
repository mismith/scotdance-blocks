interface Env {
  BLOCKS_PROJECTS: KVNamespace
}

// GET /api/projects — list user's projects (metadata only)
async function handleGet(
  context: EventContext<Env, string, Record<string, unknown>>,
): Promise<Response> {
  const uid = context.data.uid as string
  const list = await context.env.BLOCKS_PROJECTS.list({ prefix: `${uid}:` })

  const projects = list.keys.map((key) => ({
    id: key.name.slice(uid.length + 1), // strip "uid:" prefix
    name: (key.metadata as { name?: string })?.name ?? 'Untitled',
    updatedAt: (key.metadata as { updatedAt?: number })?.updatedAt ?? 0,
  }))

  // Sort by most recently updated
  projects.sort((a, b) => b.updatedAt - a.updatedAt)

  return new Response(JSON.stringify(projects), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST /api/projects — create a new project
async function handlePost(
  context: EventContext<Env, string, Record<string, unknown>>,
): Promise<Response> {
  const uid = context.data.uid as string

  let body: { id: string; name: string; data: unknown }
  try {
    body = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body.id || !body.data) {
    return new Response(
      JSON.stringify({ error: 'Missing id or data' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const key = `${uid}:${body.id}`
  const now = Date.now()

  await context.env.BLOCKS_PROJECTS.put(key, JSON.stringify(body.data), {
    metadata: { name: body.name || 'Untitled', updatedAt: now },
  })

  return new Response(
    JSON.stringify({ id: body.id, name: body.name, updatedAt: now }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

export const onRequest: PagesFunction<Env> = async (context) => {
  switch (context.request.method) {
    case 'GET':
      return handleGet(context)
    case 'POST':
      return handlePost(context)
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
  }
}
