import jwt from 'jsonwebtoken'

export default function authMiddleware(req,res,next){
  const auth = req.headers.authorization
  if(!auth) return res.status(401).json({ message:'Not authenticated' })
  const token = auth.split(' ')[1]
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.id
    next()
  }catch(e){ res.status(401).json({ message:'Invalid token' }) }
}
