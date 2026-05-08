import express from 'express'
import { authenticate } from '../middleware/auth'
import { managerOnly } from '../middleware/roleGuard'
import { 
  getPendingReps, 
  approveRep, 
  rejectRep, 
  getMyRepsList 
} from '../controllers/managerController'

const router = express.Router()

router.use(authenticate, managerOnly)

router.get('/pending-reps', getPendingReps)
router.post('/approve-rep/:repId', approveRep)
router.post('/reject-rep/:repId', rejectRep)
router.get('/my-reps', getMyRepsList)

export default router
