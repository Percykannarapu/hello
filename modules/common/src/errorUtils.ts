export function isError(e: any) : e is Error {
  return e && e.stack && e.message && typeof e.stack === 'string' && typeof e.message === 'string';
}

