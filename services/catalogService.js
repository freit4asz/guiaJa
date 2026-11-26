const DomainError = require('../errors/DomainError');
const repository = require('../repositories/catalogRepository');
const {getResource, validateResource} = require('../models/catalogResources');
const {positiveId} = require('../models/validation');

async function getPackage(id) {
  const item = await repository.packageDetails(positiveId(id));
  if (!item) throw new DomainError('Pacote não encontrado.', 404);
  return item;
}

async function listResource(name) {
  getResource(name);
  return repository.list(name);
}

async function createResource(name, input) {
  validateResource(name, input);
  return repository.create(name, input);
}

async function updateResource(name, rawId, input) {
  validateResource(name, input, true);
  const id = positiveId(rawId);
  const updated = await repository.update(name, id, input);
  if (!updated) throw new DomainError('Registro não encontrado.', 404);
  return updated;
}

async function deleteResource(name, rawId) {
  const id = positiveId(rawId);
  if (!(await repository.find(name, id))) throw new DomainError('Registro não encontrado.', 404);
  await repository.remove(name, id);
}

module.exports = {getPackage, listResource, createResource, updateResource, deleteResource};
