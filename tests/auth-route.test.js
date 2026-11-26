const test = require('node:test');
const assert = require('node:assert/strict');
const {once} = require('node:events');
process.env.NODE_ENV = 'test';
const app = require('../app');

test('todas as rotas protegidas respondem 401 e solicitam HTTP Basic', async t => {
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => server.close());

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const protectedRequests = [
    ['GET', '/api/reservas'],
    ['POST', '/api/reservas'],
    ['GET', '/api/reservas/1'],
    ['PUT', '/api/reservas/1'],
    ['DELETE', '/api/reservas/1'],
    ['POST', '/api/mensagens'],
    ['GET', '/api/perfil'],
    ['PUT', '/api/perfil'],
    ['GET', '/api/admin/pacotes'],
    ['POST', '/api/admin/pacotes'],
    ['PATCH', '/api/admin/pacotes/1'],
    ['DELETE', '/api/admin/pacotes/1'],
    ['GET', '/api/admin/dashboard'],
    ['GET', '/api/admin/accesses'],
    ['GET', '/api/admin/historico-reservas'],
    ['GET', '/api/admin/candidaturas'],
    ['GET', '/api/admin/notificacoes-email'],
    ['PATCH', '/api/admin/reservas/1/guia']
  ];

  for (const [method, path] of protectedRequests) {
    const response = await fetch(`${baseUrl}${path}`, {method});
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.match(response.headers.get('www-authenticate'), /^Basic realm=/);
    assert.deepEqual(await response.json(), {erro: 'Autenticação HTTP Basic necessária.'});
  }
});
