const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {parseBasicAuthorization, hashPassword, verifyPassword} = require('../services/authService');
const {emailValido, positiveId, validDate} = require('../models/validation');
const {validateResource} = require('../models/catalogResources');
const {requireRole} = require('../middleware/basicAuth');
const DomainError = require('../errors/DomainError');

test('decodifica credenciais HTTP Basic com senha contendo dois-pontos', () => {
  const header = `Basic ${Buffer.from('ana@email.com:senha:forte').toString('base64')}`;
  assert.deepEqual(parseBasicAuthorization(header), {
    email: 'ana@email.com',
    password: 'senha:forte'
  });
});

test('recusa cabeçalho Basic ausente ou sem usuário', () => {
  assert.equal(parseBasicAuthorization(undefined), null);
  assert.equal(parseBasicAuthorization(`Basic ${Buffer.from(':senha').toString('base64')}`), null);
});

test('valida e-mail, identificador e data sem normalizar valores inválidos', () => {
  assert.equal(emailValido('pessoa@exemplo.com'), true);
  assert.equal(emailValido('sem-email'), false);
  assert.equal(positiveId('3'), 3);
  assert.throws(() => positiveId('0'), DomainError);
  assert.equal(validDate('2030-02-28'), '2030-02-28');
  assert.throws(() => validDate('2030-02-30'), DomainError);
});

test('grava senhas com scrypt e reconhece hashes legados de demonstração', async () => {
  const storedHash = await hashPassword('senha-forte');
  assert.match(storedHash, /^scrypt\$/);
  assert.equal((await verifyPassword('senha-forte', storedHash)).valid, true);
  assert.equal((await verifyPassword('senha-errada', storedHash)).valid, false);
  const legacyHash = crypto.createHash('sha256').update('Senha@123').digest('hex');
  assert.deepEqual(
    await verifyPassword('Senha@123', legacyHash),
    {valid: true, legacy: true}
  );
});

test('middleware de perfil retorna 403 quando o perfil não está autorizado', () => {
  let captured;
  requireRole('admin')({user: {tipo: 'cliente'}}, {}, error => { captured = error; });
  assert.equal(captured.status, 403);
});

test('valida campos obrigatórios e valores monetários no CRUD administrativo', () => {
  assert.throws(() => validateResource('pacotes', {nome: 'Pacote', duracao_dias: 3, preco: -1, id_destino: 1}), DomainError);
  assert.throws(() => validateResource('destinos', {cidade: ' ', pais: 'Brasil'}), DomainError);
  assert.doesNotThrow(() => validateResource('pacotes', {
    nome: 'Bonito', duracao_dias: 3, preco: 100, id_destino: 1
  }));
});
