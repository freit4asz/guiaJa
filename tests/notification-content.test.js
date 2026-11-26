const test = require('node:test');
const assert = require('node:assert/strict');
const notifications = require('../services/notificationContent');

test('candidatura de guia inclui nome, e-mail e currículo na mensagem administrativa', () => {
  const notification = notifications.guideApplication({
    nome: 'Guia Exemplo',
    email: 'guia@example.com',
    curriculo: 'Experiência em turismo local'
  });

  assert.equal(notification.subject, 'Nova candidatura de guia - GuiaJa');
  assert.match(notification.text, /Guia Exemplo/);
  assert.match(notification.text, /guia@example\.com/);
  assert.match(notification.text, /Experiência em turismo local/);
});

test('notificação de compra identifica cliente, pacote, voucher e total', () => {
  const notification = notifications.purchase({
    user: {nome: 'Cliente Exemplo', email: 'cliente@example.com'},
    codigo: 'GJ-123ABC',
    dataIda: '2030-01-15',
    packageName: 'Pacote de Bonito',
    destination: 'Bonito, MS, Brasil',
    guideName: 'Guia Exemplo',
    hotelName: 'Hotel Exemplo',
    total: 2500
  });

  assert.match(notification.subject, /GJ-123ABC/);
  assert.match(notification.text, /Cliente Exemplo/);
  assert.match(notification.text, /cliente@example\.com/);
  assert.match(notification.text, /Pacote de Bonito/);
  assert.match(notification.text, /R\$ 2500\.00/);
});

test('notificação identifica o trecho de voo sem aplicar desconto de pacote', () => {
  const notification = notifications.purchase({
    user: {nome: 'Cliente Exemplo', email: 'cliente@example.com'},
    codigo: 'GJ-VOO123',
    dataIda: '2030-01-15',
    packageName: 'Voo São Paulo → Lisboa',
    destination: 'Lisboa',
    total: 3200,
    flightRoute: 'São Paulo → Lisboa'
  });

  assert.match(notification.text, /Voo: São Paulo → Lisboa/);
  assert.doesNotMatch(notification.text, /Desconto do pacote/);
});

test('notificação registra o preço original e o desconto de pacote', () => {
  const notification = notifications.purchase({
    user: {nome: 'Cliente Exemplo', email: 'cliente@example.com'},
    codigo: 'GJ-PAC123',
    dataIda: '2030-01-15',
    packageName: 'Pacote de Bonito',
    total: 1890.5,
    packageOriginal: 1990,
    discount: 99.5
  });

  assert.match(notification.text, /Valor original do pacote: R\$ 1990\.00/);
  assert.match(notification.text, /Desconto do pacote: R\$ 99\.50/);
});
