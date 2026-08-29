import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import customerRoutes from '../modules/customer/customer.routes';
import productRoutes from '../modules/product/product.routes';
import applicationRoutes from '../modules/application/application.routes';
import financeRoutes from '../modules/finance/finance.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/loan-products', productRoutes);
router.use('/applications', applicationRoutes);
router.use('/finance', financeRoutes);

export default router;
