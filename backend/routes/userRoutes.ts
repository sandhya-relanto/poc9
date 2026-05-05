import express from 'express'
import { authenticate } from '../middleware/auth'
import { managerOnly } from '../middleware/roleGuard'
import { getMe, getReps, getOrganizationDetails, getRepSessions, getDashboardStats, getCoachingAlerts, getTeamAnalytics, getMyAnalytics, assignTraining, getMyAssignments, getTeamAssignments, addNote, getRepNotes, getMyNotes, getSentNotes } from '../controllers/userController'

const router = express.Router()

// GET /api/users/me
router.get('/me', authenticate, getMe)

// GET /api/users/my-analytics
router.get('/my-analytics', authenticate, getMyAnalytics)

// GET /api/users/my-assignments
router.get('/my-assignments', authenticate, getMyAssignments)

// GET /api/users/my-notes
router.get('/my-notes', authenticate, getMyNotes)

// GET /api/users/reps
router.get('/reps', authenticate, managerOnly, getReps)

// GET /api/users/organization
router.get('/organization', authenticate, managerOnly, getOrganizationDetails)

// GET /api/users/dashboard-stats
router.get('/dashboard-stats', authenticate, managerOnly, getDashboardStats)

// GET /api/users/coaching-alerts
router.get('/coaching-alerts', authenticate, managerOnly, getCoachingAlerts)

// GET /api/users/team-analytics
router.get('/team-analytics', authenticate, managerOnly, getTeamAnalytics)

// GET /api/users/team-assignments
router.get('/team-assignments', authenticate, managerOnly, getTeamAssignments)

// POST /api/users/assign-training
router.post('/assign-training', authenticate, managerOnly, assignTraining)

// GET /api/users/reps/:repId/sessions
router.get('/reps/:repId/sessions', authenticate, managerOnly, getRepSessions)

// GET /api/users/reps/:repId/notes
router.get('/reps/:repId/notes', authenticate, managerOnly, getRepNotes)

// POST /api/users/reps/:repId/notes
router.post('/reps/:repId/notes', authenticate, managerOnly, addNote)

// GET /api/users/sent-notes
router.get('/sent-notes', authenticate, managerOnly, getSentNotes)

export default router
