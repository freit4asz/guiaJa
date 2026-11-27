const test = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../middleware/errorHandler');

test('errores de conexão MySQL retornam instruções específicas para configuração hospedada', () => {
  const cases = [
    ['ER_ACCESS_DENIED_ERROR', /MYSQL_USER e MYSQL_PASSWORD/],
    ['ECONNREFUSED', /MYSQL_HOST, MYSQL_PORT/],
    ['ETIMEDOUT', /regras de rede/],
    ['ENOTFOUND', /MYSQL_HOST/]
  ];

  for (const [code, message] of cases) {
    const response = {
      statusCode: null,
      body: null,
      headersSent: false,
      status(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      }
    };

    errorHandler(
      Object.assign(new Error('connection error'), {code}),
      {method: 'GET', originalUrl: '/api/pacotes'},
      response,
      () => assert.fail('não deveria encaminhar o erro')
    );

    assert.equal(response.statusCode, 500);
    assert.match(response.body.erro, message);
  }
});
