const DomainError = require('../errors/DomainError');

const databaseMessages = {
  ER_ACCESS_DENIED_ERROR: 'Acesso ao MySQL negado. Confira MYSQL_PASSWORD no arquivo .env.',
  ER_BAD_DB_ERROR: 'O banco guiaja não existe. Importe banco/guiaja_banco.sql.',
  ECONNREFUSED: 'Não foi possível conectar ao MySQL. Confira se o serviço está iniciado.'
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
