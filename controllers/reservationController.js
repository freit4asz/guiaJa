const service = require('../services/reservationService');

async function create(req, res) {
  res.status(201).json(await service.create(req.user, req.body));
}

async function list(req, res) {
  res.json(await service.list(req.user));
}

async function details(req, res) {
  res.json(await service.getDetails(req.user, req.params.id));
}

async function update(req, res) {
  res.json(await service.update(req.user, req.params.id, req.body));
}

async function cancel(req, res) {
  await service.cancel(req.user, req.params.id);
  res.status(204).end();
}

module.exports = {create, list, details, update, cancel};
