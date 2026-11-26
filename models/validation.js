const DomainError = require('../errors/DomainError');

const emailValido = email => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new DomainError(`${label} é obrigatório e deve ter até ${maxLength} caracteres.`);
  }
}

function positiveId(value, label = 'Identificador') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new DomainError(`${label} inválido.`);
  return id;
}

function validDate(value, label = 'Data') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DomainError(`${label} inválida.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new DomainError(`${label} inválida.`);
  }
  return value;
}

module.exports = {emailValido, requiredText, positiveId, validDate};
