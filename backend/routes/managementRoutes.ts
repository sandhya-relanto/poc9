import express from 'express'
import { authenticate } from '../middleware/auth'
import { adminOnly, managerOnly } from '../middleware/roleGuard'
import { 
  getAdminStats, 
  getPendingManagers, 
  getManagersList, 
  getUsersManagement,
  approveManager
} from '../controllers/adminController'
import { 
  getPendingReps, 
  getMyRepsList 
} from '../controllers/managerController'
import { getApprovedManagers } from '../controllers/authController'

const router = express.Router()

// ─── Public ─────────────────────────────────────────────
router.get('/approved-managers', getApprovedManagers)

// ─── Admin Endpoints ─────────────────────────────────────
router.get('/admin/stats', authenticate, adminOnly, getAdminStats)
router.get('/admin/pending', authenticate, adminOnly, getPendingManagers)
router.get('/admin/users', authenticate, adminOnly, getUsersManagement)
router.patch('/admin/update-user', authenticate, adminOnly, approveManager) // Map to existing if needed, or placeholder

// ─── Manager Endpoints ───────────────────────────────────
router.get('/manager/stats', authenticate, managerOnly, getMyRepsList) // Placeholder for stats
router.get('/manager/pending-reps', authenticate, managerOnly, getPendingReps)
router.get('/manager/reps', authenticate, managerOnly, getMyRepsList)

export default router
