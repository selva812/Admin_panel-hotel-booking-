// utils/auth.ts
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}
