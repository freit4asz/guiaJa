const crypto = require('crypto');
const {promisify} = require('util');
const DomainError = require('../errors/DomainError');
const userRepository = require('../repositories/userRepository');
const {emailValido, requiredText} = require('../models/validation');

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64, {maxmem: 32 * 1024 * 1024});
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return {valid: false, legacy: false};
  if (storedHash.startsWith('scrypt$')) {
    const [, saltHex, keyHex] = storedHash.split('$');
    if (!/^[\da-f]{32}$/i.test(saltHex || '') || !/^[\da-f]{128}$/i.test(keyHex || '')) {
      return {valid: false, legacy: false};
    }
    const expected = Buffer.from(keyHex, 'hex');
    const candidate = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, {maxmem: 32 * 1024 * 1024});
    return {valid: crypto.timingSafeEqual(candidate, expected), legacy: false};
  }
  if (!/^[\da-f]{64}$/i.test(storedHash)) return {valid: false, legacy: false};
  const expected = Buffer.from(storedHash, 'hex');
  const candidate = crypto.createHash('sha256').update(password).digest();
  return {valid: crypto.timingSafeEqual(candidate, expected), legacy: true};
}

async function upgradeLegacyPassword(user, password, verification) {
  if (verification.legacy) {
    await userRepository.updatePasswordHash(user.id, await hashPassword(password));
  }
}

async function login(email, password) {
  if (!emailValido(email) || typeof password !== 'string' || !password) {
    throw new DomainError('E-mail ou senha incorretos.', 401);
  }
  const user = await userRepository.findByEmail(email.trim().toLowerCase());
  if (!user) {
    throw new DomainError('E-mail ou senha incorretos.', 401);
  }
  const verification = await verifyPassword(password, user.senha);
  if (!verification.valid) throw new DomainError('E-mail ou senha incorretos.', 401);
  if (user.bloqueado) throw new DomainError('Conta bloqueada. Fale com o suporte.', 403);
  await upgradeLegacyPassword(user, password, verification);
  const basic = Buffer.from(`${user.email}:${password}`).toString('base64');
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    tipo: user.tipo,
    authorization: `Basic ${basic}`
  };
}

async function authenticate(email, password) {
  if (!email || typeof password !== 'string') throw new DomainError('Autenticação necessária.', 401);
  const user = await userRepository.findByEmail(email.toLowerCase());
  if (!user) throw new DomainError('Credenciais inválidas.', 401);
  const verification = await verifyPassword(password, user.senha);
  if (!verification.valid) throw new DomainError('Credenciais inválidas.', 401);
  if (user.bloqueado) throw new DomainError('Conta bloqueada.', 403);
  await upgradeLegacyPassword(user, password, verification);
  return {id: user.id, nome: user.nome, email: user.email, tipo: user.tipo};
}

async function register(input) {
  const {nome, email, telefone, senha} = input || {};
  requiredText(nome, 'Nome', 100);
  requiredText(telefone, 'Telefone', 20);
  if (!emailValido(email) || email.length > 100) throw new DomainError('Digite um e-mail válido.');
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 255) {
    throw new DomainError('A senha precisa ter entre 8 e 255 caracteres.');
  }
  await userRepository.create({
    nome: nome.trim(),
    email: email.toLowerCase(),
    telefone,
    senhaHash: await hashPassword(senha)
  });
}

function parseBasicAuthorization(header) {
  if (typeof header !== 'string' || !/^Basic\s+/i.test(header)) return null;
  const encoded = header.replace(/^Basic\s+/i, '');
  let decoded;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const separator = decoded.indexOf(':');
  if (separator <= 0) return null;
  return {email: decoded.slice(0, separator), password: decoded.slice(separator + 1)};
}

module.exports = {login, authenticate, register, parseBasicAuthorization, hashPassword, verifyPassword};
