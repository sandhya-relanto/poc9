export const adminOnly = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' })
  }
  next()
}

export const managerOnly = (req: any, res: any, next: any) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Managers only.' })
  }
  next()
}

export const repOnly = (req: any, res: any, next: any) => {
  if (req.user.role !== 'rep' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Reps only.' })
  }
  next()
}