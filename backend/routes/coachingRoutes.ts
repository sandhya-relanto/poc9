import express from 'express'
import { authenticate } from '../middleware/auth'
import { repOnly } from '../middleware/roleGuard'
import { getMySignals } from '../controllers/coachingController'

const router = express.Router()

// GET /api/coaching/my-signals
router.get('/my-signals', authenticate, repOnly, getMySignals)

export default router
