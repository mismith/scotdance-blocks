import { jwtVerify, createRemoteJWKSet } from 'jose'

interface Env {
  BLOCKS_PROJECTS: KVNamespace
}

const FIREBASE_PROJECT_ID = 'firebase-scotdance'

const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
)

export const onRequest: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    })

    if (!payload.sub) {
      throw new Error('Missing sub claim')
    }

    // Attach uid to the context for downstream handlers
    context.data.uid = payload.sub
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return context.next()
}
