const DomainError = require('../errors/DomainError');

const databaseMessages = {
  ER_ACCESS_DENIED_ERROR: 'Acesso ao MySQL negado. Confira MYSQL_USER e MYSQL_PASSWORD nas variáveis de ambiente.',
  ER_BAD_DB_ERROR: 'O banco configurado não existe. Confira MYSQL_DATABASE e importe banco/guiaja_banco.sql.',
  ECONNREFUSED: 'Conexão MySQL recusada. Confira MYSQL_HOST, MYSQL_PORT e se o provedor aceita conexões externas.',
  ETIMEDOUT: 'Tempo esgotado ao conectar ao MySQL. Confira MYSQL_HOST, MYSQL_PORT e as regras de rede do provedor.',
  ENOTFOUND: 'Servidor MySQL não encontrado. Confira o valor de MYSQL_HOST.',
  ECONNRESET: 'Conexão com MySQL interrompida. Confira a disponibilidade do banco e as configurações de rede.'
};

module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof DomainError) {
    return res.status(error.status).json({erro: error.message});
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({erro: 'Já existe um registro com esses dados.'});
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({erro: 'Não é possível concluir a operação por causa de registros relacionados.'});
  }

  console.error(`Erro na API ${req.method} ${req.originalUrl}:`, error.code || error.name, error.message);
  return res.status(500).json({
    erro: databaseMessages[error.code] || 'Não foi possível concluir a operação. Confira a conexão e o esquema do banco MySQL.'
  });
};
