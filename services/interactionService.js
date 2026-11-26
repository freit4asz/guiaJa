const DomainError = require('../errors/DomainError');
const repository = require('../repositories/interactionRepository');
const notificationContent = require('./notificationContent');
const mailer = require('../config/mailer');
const {emailValido, requiredText, positiveId} = require('../models/validation');

async function contact(input) {
  const {nome, email, assunto} = input || {};
  requiredText(nome, 'Nome', 100);
  requiredText(assunto, 'Assunto', 5000);
  if (!emailValido(email) || email.length > 100) throw new DomainError('Digite um e-mail válido.');
  await repository.createContact({nome: nome.trim(), email: email.toLowerCase(), assunto: assunto.trim()});
}

async function applyAsGuide(input) {
  const {nome, email, curriculo} = input || {};
  requiredText(nome, 'Nome', 100);
  requiredText(curriculo, 'Currículo', 5000);
  if (!emailValido(email) || email.length > 100) throw new DomainError('Digite um e-mail válido.');
  const id = await repository.createGuideApplication({
    nome: nome.trim(),
    email: email.toLowerCase(),
    curriculo,
    notification: notificationContent.guideApplication({
      nome: nome.trim(),
      email: email.toLowerCase(),
      curriculo
    })
  });
  return {
    id,
    emailStatus: mailer.isConfigured() ? 'pendente' : 'aguardando_configuracao'
  };
}

async function sendMessage(user, input) {
  const {idGuia, conteudo} = input || {};
  const guideId = positiveId(idGuia, 'Guia');
  requiredText(conteudo, 'Mensagem', 1000);
  await repository.createMessage({
    user,
    guideId,
    content: conteudo.trim(),
    notificationFor: guide => notificationContent.guideMessage({
      senderName: user.nome,
      senderEmail: user.email,
      guideName: guide.nome,
      content: conteudo.trim()
    })
  });
  return {emailStatus: mailer.isConfigured() ? 'pendente' : 'aguardando_configuracao'};
}

module.exports = {contact, applyAsGuide, sendMessage};
