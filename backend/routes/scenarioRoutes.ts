import express from 'express'
import { authenticate } from '../middleware/auth'
import { managerOnly } from '../middleware/roleGuard'
import { getScenarios, createScenario, getScenario } from '../controllers/scenarioController'

const router = express.Router()

// GET /api/scenarios (manager and rep can view org scenarios)
router.get('/', authenticate, getScenarios)

// GET /api/scenarios/:scenarioId (fetch single scenario)
router.get('/:scenarioId', authenticate, getScenario)

// POST /api/scenarios (managers only can create)
router.post('/', authenticate, managerOnly, createScenario)

export default router
