import httpClient from '@/module/http/httpClient'
export default (ctx, inject) => {
  const options = <%= JSON.stringify(options, null, 2) %>
  const client = new httpClient(options.httpBaseUri, ctx, options)
  ctx.$http = client
  inject('http', client)
}
