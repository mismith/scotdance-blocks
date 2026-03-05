interface Env {
  BLOCKS_PROJECTS: KVNamespace
}

// GET /api/projects/:id — load project data
async function handleGet(
  context: EventContext<Env, 'id', Record<string, unknown>>,
): Promise<Response> {
  const uid = context.data.uid as string
  const projectId = context.params.id
  const key = `${uid}:${projectId}`

  const value = await context.env.BLOCKS_PROJECTS.get(key)
  if (value === null) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(value, {
    headers: { 'Content-Type': 'application/json' },
  })
}

// PUT /api/projects/:id — save project data
async function handlePut(
  context: EventContext<Env, 'id', Record<string, unknown>>,
): Promise<Response> {
  const uid = context.data.uid as string
  const projectId = context.params.id
  const key = `${uid}:${projectId}`

  let body: { name: string; data: unknown }
  try {
    body = await context.request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()

  await context.env.BLOCKS_PROJECTS.put(key, JSON.stringify(body.data), {
    metadata: { name: body.name || 'Untitled', updatedAt: now },
  })

  return new Response(
    JSON.stringify({ id: projectId, name: body.name, updatedAt: now }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

// DELETE /api/projects/:id — delete a project
async function handleDelete(
  context: EventContext<Env, 'id', Record<string, unknown>>,
): Promise<Response> {
  const uid = context.data.uid as string
  const projectId = context.params.id
  const key = `${uid}:${projectId}`

  await context.env.BLOCKS_PROJECTS.delete(key)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  switch (context.request.method) {
    case 'GET':
      return handleGet(context)
    case 'PUT':
      return handlePut(context)
    case 'DELETE':
      return handleDelete(context)
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
  }
}
