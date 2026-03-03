import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    nickname: string
    isAdmin: boolean
  }

  interface Session {
    user: {
      id: string
      nickname: string
      isAdmin: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    nickname: string
    isAdmin: boolean
  }
}
