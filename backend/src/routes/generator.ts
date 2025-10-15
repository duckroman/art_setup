import { Router } from 'express';
import { generateScenarioImage, generateShadows } from '../controllers/generatorController';

const router = Router();

router.post('/scenario', generateScenarioImage);
router.post('/shadows', generateShadows);

export default router;
