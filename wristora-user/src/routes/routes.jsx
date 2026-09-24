import { createBrowserRouter } from 'react-router-dom';
import { userRoutes } from './userRoutes';

/**
 * Wristora User Application Router
 * 
 * Assembles all public customer-facing storefront, catalog, customer care,
 * and authenticated collector routes.
 */
export const router = createBrowserRouter([
  userRoutes,
]);

export default router;
