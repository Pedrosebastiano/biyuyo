import { create } from "https://deno.land/x/djwt@v2.4/mod.ts"

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') || '{}')

    // Creamos el token de acceso manualmente para evitar errores de librerías grandes
    const jwt = await create({ alg: "RS256", typ: "JWT" }, {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform"
    }, serviceAccount.private_key)

    // Obtenemos el token real de Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    })
    const { access_token } = await tokenRes.json()

    // Enviamos la notificación
    const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`
      },
      body: JSON.stringify({
        message: {
          topic: "all",
          notification: {
            title: "🔔 Biyuyo: Recordatorio",
            body: `Tienes pendiente: ${record.reminder_name || 'un pago'}`
          }
        }
      })
    })

    return new Response(JSON.stringify(await fcmRes.json()), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})