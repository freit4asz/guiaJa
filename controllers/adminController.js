const service = require('../services/adminService');

async function dashboard(req, res) {
  res.json(await service.dashboard());
}

async function accesses(req, res) {
  res.json(await service.accesses(req.query));
}

async function updateReservationGuide(req, res) {
  res.json(await service.updateReservationGuide(req.user, req.params.id, req.body));
}

async function reservationHistory(req, res) {
  res.json(await service.reservationHistory(req.params.id));
}

async function recentReservationHistory(req, res) {
  res.json(await service.recentReservationHistory());
}

async function guideApplications(req, res) {
  res.json(await service.guideApplications());
}

async function emailNotifications(req, res) {
  res.json(await service.emailNotifications());
}

module.exports = {
  dashboard,
  accesses,
  updateReservationGuide,
  reservationHistory,
  recentReservationHistory,
  guideApplications,
  emailNotifications
};
