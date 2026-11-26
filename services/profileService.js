const DomainError = require('../errors/DomainError');
const userRepository = require('../repositories/userRepository');
const {requiredText} = require('../models/validation');

async function getProfile(user) {
  const profile = await userRepository.findProfileById(user.id);
  if (!profile) throw new DomainError('Perfil não encontrado.', 404);
  return profile;
}

async function updateProfile(user, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new DomainError('Envie um objeto JSON válido.');
  }
  const unknown = Object.keys(input).filter(key => !['nome', 'telefone'].includes(key));
  if (unknown.length) throw new DomainError(`Campos não permitidos: ${unknown.join(', ')}.`);

  requiredText(input.nome, 'Nome', 100);
  const nome = input.nome.trim();
  const telefone = input.telefone === undefined ? '' : input.telefone;
  if (typeof telefone !== 'string' || telefone.length > 20) {
    throw new DomainError('Telefone deve ser um texto de até 20 caracteres.');
  }

  const profile = await userRepository.updateProfile(user.id, {
    nome,
    telefone: telefone.trim() || null
  });
  if (!profile) throw new DomainError('Perfil não encontrado.', 404);
  return profile;
}

module.exports = {getProfile, updateProfile};
