import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'afhoahsfpijhpoajwrhp3aryoq@H333$231839082345j'

export const generateToken = user => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' })
}

export const verifyToken = token => {
  try {
    return jwt.verify(token, SECRET)
  } catch (error) {
    return null
  }
}
