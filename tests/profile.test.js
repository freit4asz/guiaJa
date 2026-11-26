const test = require('node:test');
const assert = require('node:assert/strict');
const userRepository = require('../repositories/userRepository');
const profileService = require('../services/profileService');

test('perfil só atualiza nome e telefone e normaliza os valores informados', async () => {
  const originalUpdate = userRepository.updateProfile;
  const originalFind = userRepository.findProfileById;
  let update;
  userRepository.updateProfile = async (id, fields) => {
    update = {id, ...fields};
    return {id, ...fields, email: 'cliente@exemplo.com', tipo: 'cliente'};
  };
  userRepository.findProfileById = async () => undefined;

  try {
    const user = {id: 7, nome: 'Cliente', email: 'cliente@exemplo.com'};
    const profile = await profileService.updateProfile(user, {
      nome: '  Ana Silva  ',
      telefone: '  11999990000  '
    });
    assert.deepEqual(update, {id: 7, nome: 'Ana Silva', telefone: '11999990000'});
    assert.equal(profile.email, user.email);
    await assert.rejects(
      profileService.updateProfile(user, {nome: 'Ana', telefone: '', email: 'novo@exemplo.com'}),
      /Campos não permitidos/
    );
    await assert.rejects(profileService.getProfile(user), /Perfil não encontrado/);
  } finally {
    userRepository.updateProfile = originalUpdate;
    userRepository.findProfileById = originalFind;
  }
});
