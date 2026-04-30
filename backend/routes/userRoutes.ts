import express from 'express'
import { authenticate } from '../middleware/auth'
import { managerOnly } from '../middleware/roleGuard'
import { getMe, getReps, getInviteCode } from '../controllers/userController'

const router = express.Router()

// GET /api/users/me
router.get('/me', authenticate, getMe)

// GET /api/users/reps
router.get('/reps', authenticate, managerOnly, getReps)

// GET /api/users/invite-code
router.get('/invite-code', authenticate, managerOnly, getInviteCode)

export default router
