const repository = require('../repositories/catalogRepository');
const service = require('../services/catalogService');

async function packages(req, res) {
  res.json(await repository.listPackages());
}

async function packageDetails(req, res) {
  res.json(await service.getPackage(req.params.id));
}

async function guides(req, res) {
  res.json(await repository.listGuides());
}

async function hotels(req, res) {
  res.json(await repository.listHotels());
}

async function flights(req, res) {
  res.json(await repository.listFlights());
}

async function adminList(req, res) {
  res.json(await service.listResource(req.params.resource));
}

async function adminCreate(req, res) {
  res.status(201).json(await service.createResource(req.params.resource, req.body));
}

async function adminUpdate(req, res) {
  res.json(await service.updateResource(req.params.resource, req.params.id, req.body));
}

async function adminDelete(req, res) {
  await service.deleteResource(req.params.resource, req.params.id);
  res.status(204).end();
}

module.exports = {packages, packageDetails, guides, hotels, flights, adminList, adminCreate, adminUpdate, adminDelete};
