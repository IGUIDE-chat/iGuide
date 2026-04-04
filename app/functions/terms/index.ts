import { proxyToLanding } from '../_proxy'

export const onRequest: PagesFunction = (context) => proxyToLanding(context)
