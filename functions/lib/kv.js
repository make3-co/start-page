/** KV binding is only present when configured (Dashboard + optional wrangler.toml). Local `pages dev` without binding must not crash. */
export function getStartPageKv(env) {
  return env.START_PAGE_DATA ?? null;
}
