import express from 'express'
import { managerSignup, getApprovedManagers, repSignup, login, signupAdmin } from '../controllers/authController'

const router = express.Router()

router.post('/signup/manager', managerSignup)
router.get('/approved-managers', getApprovedManagers)
router.post('/signup/rep', repSignup)
router.post('/login', login)
router.post('/signup/admin', signupAdmin)

export default router