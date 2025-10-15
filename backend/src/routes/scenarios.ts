import { Router } from 'express';
import { getScenarios, createScenario, deleteScenario } from '../controllers/scenarioController';
import upload from '../middleware/upload';

const router = Router();

router.get('/', getScenarios);
router.post('/', upload.single('scenarioImage'), createScenario);
router.delete('/:id', deleteScenario);

export default router;
