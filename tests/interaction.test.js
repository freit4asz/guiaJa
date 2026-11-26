const test = require('node:test');
const assert = require('node:assert/strict');
const repository = require('../repositories/interactionRepository');
const interactionService = require('../services/interactionService');

test('mensagem autenticada é validada e gera aviso personalizado ao guia', async () => {
  const originalCreateMessage = repository.createMessage;
  let savedMessage;
  repository.createMessage = async input => {
    savedMessage = input;
  };

  try {
    const user = {id: 4, nome: 'Ana Silva', email: 'ana@exemplo.com'};
    const result = await interactionService.sendMessage(user, {
      idGuia: '2',
      conteudo: '  Olá, gostaria de combinar a viagem.  '
    });

    assert.equal(savedMessage.user, user);
    assert.equal(savedMessage.guideId, 2);
    assert.equal(savedMessage.content, 'Olá, gostaria de combinar a viagem.');
    assert.match(savedMessage.notificationFor({nome: 'João Silva'}).subject, /João Silva/);
    assert.match(savedMessage.notificationFor({nome: 'João Silva'}).text, /ana@exemplo.com/);
    assert.equal(typeof result.emailStatus, 'string');
    await assert.rejects(
      interactionService.sendMessage(user, {idGuia: 2, conteudo: ' '}),
      /Mensagem é obrigatório/
    );
  } finally {
    repository.createMessage = originalCreateMessage;
  }
});
