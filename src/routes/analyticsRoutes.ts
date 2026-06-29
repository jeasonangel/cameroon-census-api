import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// No router.use(authenticate) — applied per-route below

router.get('/regions', authenticate, analyticsController.getAllRegions);
router.get('/regions/:code', authenticate, analyticsController.getRegionByCode);
router.get('/regions/rank/water', authenticate, analyticsController.getRegionsRankedByWater);
router.get('/departments/rank', authenticate, analyticsController.getDepartmentRankings);
router.get('/compare/regions', authenticate, analyticsController.compareRegions);
router.get('/best-worst', authenticate, analyticsController.getBestWorst);

export default router;
