/**
 * Build Set-Cookie attribute string. Omit Secure on http:// so OAuth works on localhost
 * (browsers reject Secure cookies set from non-HTTPS origins).
 */
export function buildSetCookie(request, parts) {
  const list = [...parts];
  if (new URL(request.url).protocol === 'https:') {
    list.push('Secure');
  }
  return list.join('; ');
}
