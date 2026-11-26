const DomainError = require('../errors/DomainError');
const {requiredText, emailValido} = require('./validation');

const resources = {
  pacotes: {
    table: 'pacote', id: 'id_pacote', softDelete: ['ativo', false],
    required: ['nome', 'duracao_dias', 'preco', 'id_destino'],
    fields: ['nome', 'tipo', 'descricao', 'duracao_dias', 'preco', 'ativo', 'emoji', 'cor_fundo', 'id_destino']
  },
  guias: {
    table: 'guia', id: 'id_guia', softDelete: ['status_aprovacao', 'rejeitado'],
    required: ['nome'],
    fields: ['nome', 'email', 'telefone', 'especialidade', 'curriculo', 'valor_hora', 'anos_experiencia', 'tag_status', 'status_aprovacao', 'id_destino']
  },
  hoteis: {
    table: 'hospedagem', id: 'id_hospedagem',
    required: ['nome', 'preco_diaria', 'id_destino'],
    fields: ['nome', 'endereco', 'preco_diaria', 'avaliacao', 'qtd_avaliacoes', 'id_destino']
  },
  destinos: {
    table: 'destino', id: 'id_destino',
    required: ['cidade', 'pais'],
    fields: ['cidade', 'estado', 'pais', 'descricao']
  }
};

function getResource(name) {
  const resource = resources[name];
  if (!resource) throw new DomainError('Recurso não encontrado.', 404);
  return resource;
}

function validateResource(name, data, partial = false) {
  const resource = getResource(name);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new DomainError('Envie um objeto JSON válido.');
  }

  const unknown = Object.keys(data).filter(key => !resource.fields.includes(key));
  if (unknown.length) throw new DomainError(`Campos não permitidos: ${unknown.join(', ')}.`);

  for (const field of resource.required) {
    if (!partial && (data[field] === undefined || data[field] === null || data[field] === '')) {
      throw new DomainError(`O campo ${field} é obrigatório.`);
    }
  }
  if (partial && !Object.keys(data).length) throw new DomainError('Informe ao menos um campo para atualizar.');
  const textLimits = {
    nome: 100, tipo: 50, descricao: 5000, emoji: 10, cor_fundo: 10,
    email: 100, telefone: 20, especialidade: 100, curriculo: 5000,
    tag_status: 30, status_aprovacao: 20, endereco: 150,
    cidade: 100, estado: 100, pais: 100
  };
  for (const [field, maxLength] of Object.entries(textLimits)) {
    if (data[field] === undefined || data[field] === null) continue;
    if (typeof data[field] !== 'string' || data[field].length > maxLength) {
      throw new DomainError(`${field} deve ser um texto de até ${maxLength} caracteres.`);
    }
  }
  for (const field of resource.required.filter(field => ['nome', 'cidade', 'pais'].includes(field))) {
    if (data[field] !== undefined) requiredText(data[field], field, textLimits[field]);
  }
  if (data.email && !emailValido(data.email)) throw new DomainError('E-mail inválido.');
  for (const field of ['preco', 'preco_diaria', 'valor_hora', 'avaliacao', 'qtd_avaliacoes', 'anos_experiencia']) {
    if (data[field] !== undefined && (!Number.isFinite(Number(data[field])) || Number(data[field]) < 0)) {
      throw new DomainError(`${field} deve ser um valor numérico não negativo.`);
    }
  }
  if (data.avaliacao !== undefined && Number(data.avaliacao) > 5) {
    throw new DomainError('avaliacao deve estar entre 0 e 5.');
  }
  for (const field of ['qtd_avaliacoes', 'anos_experiencia']) {
    if (data[field] !== undefined && !Number.isInteger(Number(data[field]))) {
      throw new DomainError(`${field} deve ser um número inteiro.`);
    }
  }
  if (data.duracao_dias !== undefined && (!Number.isInteger(Number(data.duracao_dias)) || Number(data.duracao_dias) < 1)) {
    throw new DomainError('duracao_dias deve ser um número inteiro positivo.');
  }
  if (data.id_destino !== undefined && (!Number.isInteger(Number(data.id_destino)) || Number(data.id_destino) < 1)) {
    throw new DomainError('id_destino inválido.');
  }
  if (data.ativo !== undefined && typeof data.ativo !== 'boolean' && ![0, 1].includes(data.ativo)) {
    throw new DomainError('ativo deve ser booleano.');
  }
  if (data.status_aprovacao !== undefined && !['pendente', 'aprovado', 'rejeitado'].includes(data.status_aprovacao)) {
    throw new DomainError('status_aprovacao inválido.');
  }
  return data;
}

module.exports = {getResource, validateResource};
