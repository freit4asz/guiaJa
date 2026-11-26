const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const {authenticate, requireRole} = require('../middleware/basicAuth');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const catalogController = require('../controllers/catalogController');
const reservationController = require('../controllers/reservationController');
const interactionController = require('../controllers/interactionController');
const adminController = require('../controllers/adminController');

const router = express.Router();
const admin = [authenticate, requireRole('admin')];

router.post('/cadastro', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/perfil', authenticate, asyncHandler(profileController.get));
router.put('/perfil', authenticate, asyncHandler(profileController.update));

router.get('/pacotes', asyncHandler(catalogController.packages));
router.get('/pacotes/:id', asyncHandler(catalogController.packageDetails));
router.get('/guias', asyncHandler(catalogController.guides));
router.get('/hoteis', asyncHandler(catalogController.hotels));
router.get('/voos', asyncHandler(catalogController.flights));

router.post('/reservas', authenticate, asyncHandler(reservationController.create));
router.get('/reservas', authenticate, asyncHandler(reservationController.list));
router.get('/reservas/:id', authenticate, asyncHandler(reservationController.details));
router.put('/reservas/:id', authenticate, asyncHandler(reservationController.update));
router.delete('/reservas/:id', authenticate, asyncHandler(reservationController.cancel));

router.post('/contato', asyncHandler(interactionController.contact));
router.post('/guias/candidatura', asyncHandler(interactionController.guideApplication));
router.post('/mensagens', authenticate, asyncHandler(interactionController.message));

router.get('/admin/dashboard', ...admin, asyncHandler(adminController.dashboard));
router.get('/admin/accesses', ...admin, asyncHandler(adminController.accesses));
router.get('/admin/historico-reservas', ...admin, asyncHandler(adminController.recentReservationHistory));
router.get('/admin/candidaturas', ...admin, asyncHandler(adminController.guideApplications));
router.get('/admin/notificacoes-email', ...admin, asyncHandler(adminController.emailNotifications));
router.patch('/admin/reservas/:id/guia', ...admin, asyncHandler(adminController.updateReservationGuide));
router.get('/admin/reservas/:id/historico', ...admin, asyncHandler(adminController.reservationHistory));
router.get('/admin/:resource', ...admin, asyncHandler(catalogController.adminList));
router.post('/admin/:resource', ...admin, asyncHandler(catalogController.adminCreate));
router.put('/admin/:resource/:id', ...admin, asyncHandler(catalogController.adminUpdate));
router.patch('/admin/:resource/:id', ...admin, asyncHandler(catalogController.adminUpdate));
router.delete('/admin/:resource/:id', ...admin, asyncHandler(catalogController.adminDelete));

module.exports = router;
