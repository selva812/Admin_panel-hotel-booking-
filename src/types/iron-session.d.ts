// types/iron-session.d.ts
import 'iron-session'

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number
      name: string
      email: string
      role: string
    }
  }
}
