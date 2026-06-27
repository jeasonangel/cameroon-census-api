import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Region routes
router.get('/regions', analyticsController.getAllRegions);
router.get('/regions/:code', analyticsController.getRegionByCode);
router.get('/regions/rank/water', analyticsController.getRegionsRankedByWater);

// Department routes
router.get('/departments/rank', analyticsController.getDepartmentRankings);

// Comparison routes
router.get('/compare/regions', analyticsController.compareRegions);

// Best/Worst routes
router.get('/best-worst', analyticsController.getBestWorst);

export default router;