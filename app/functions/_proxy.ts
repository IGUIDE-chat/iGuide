/**
 * Shared proxy helper for landing page routes.
 */
export const LANDING_ORIGIN = "https://iguide-landing.pages.dev"

export async function proxyToLanding(context: {
  request: Request
}): Promise<Response> {
  const url = new URL(context.request.url)
  const target = `${LANDING_ORIGIN}${url.pathname}${url.search}`

  const res = await fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
  })

  const response = new Response(res.body, {
    status: res.status,
    headers: res.headers,
  })

  response.headers.set("Access-Control-Allow-Origin", "*")
  return response
}
