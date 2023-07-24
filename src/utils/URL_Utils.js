export function generateURL(baseURL, params_obj = null) {
  let uploadURL = baseURL
  let paramStr = ''
  if (params_obj) paramStr = `?${new URLSearchParams(params_obj).toString()}`

  return `${uploadURL}${paramStr}`
}
