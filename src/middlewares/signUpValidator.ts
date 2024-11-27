import { createMiddleware } from 'hono/factory'

export type SignUpDataType = {
  email: string,
  password: string,
  name: string,
  role: string
}

export const signUpValidator = createMiddleware<{
  Variables: {
    signUpData: SignUpDataType
  }
}>(async (c, next) => {
