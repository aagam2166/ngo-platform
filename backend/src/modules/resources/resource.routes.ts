import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createResourceHandler,
  getResourcesHandler,
  updateResourceHandler,
  deleteResourceHandler,
  allocateResourceHandler,
  deallocateResourceHandler,
  getRequestAllocationsHandler,
} from './resource.controller';

const router = Router();

const ngoOnly = [authenticate, authorize('NGO_ADMIN', 'SUPER_ADMIN')];

// ── Inventory CRUD ─────────────────────────────────────────────
router.post('/',     ...ngoOnly, createResourceHandler);
router.get('/',      ...ngoOnly, getResourcesHandler);
router.patch('/:id', ...ngoOnly, updateResourceHandler);
router.delete('/:id', ...ngoOnly, deleteResourceHandler);

// ── Allocation ─────────────────────────────────────────────────
// Allocate a resource to a request (deducts from inventory)
router.post('/:id/allocate', ...ngoOnly, allocateResourceHandler);

// Remove a specific allocation (restores quantity to inventory)
router.delete('/allocations/:id', ...ngoOnly, deallocateResourceHandler);

// Get all resource allocations for a specific request
router.get('/request/:requestId/allocations', ...ngoOnly, getRequestAllocationsHandler);

export default router;