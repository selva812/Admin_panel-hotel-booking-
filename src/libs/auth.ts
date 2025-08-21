import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

interface SessionData {
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword)
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), {
    password: process.env.SESSION_SECRET!,
    cookieName: 'hotel-admin-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  })
}
