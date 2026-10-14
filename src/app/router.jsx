import { createBrowserRouter } from 'react-router';
import { marketingRoutes } from './marketingRoutes';

/* Marketing router for remvo.app, in the browser. The routes live in
 * marketingRoutes.jsx so the build can pre-render the same tree. */
export const router = createBrowserRouter(marketingRoutes);
