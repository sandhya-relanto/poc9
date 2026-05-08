import express from 'express'
import { authenticate } from '../middleware/auth'
import { adminOnly } from '../middleware/roleGuard'
import { 
  getAdminStats, 
  getPendingManagers, 
  approveManager, 
  rejectManager, 
  getManagersList, 
  getUsersManagement, 
  deactivateUser, 
  activateUser, 
  resetPassword, 
  deleteUser 
} from '../controllers/adminController'

const router = express.Router()

router.use(authenticate, adminOnly)

router.get('/stats', getAdminStats)
router.get('/pending-managers', getPendingManagers)
router.post('/approve-manager/:userId', approveManager)
router.post('/reject-manager/:userId', rejectManager)
router.get('/managers', getManagersList)
router.get('/users', getUsersManagement)
router.patch('/users/:userId/deactivate', deactivateUser)
router.patch('/users/:userId/activate', activateUser)
router.patch('/users/:userId/reset-password', resetPassword)
router.delete('/users/:userId', deleteUser)

export default router
