const DomainError = require('../errors/DomainError');
const repository = require('../repositories/adminRepository');
const mailer = require('../config/mailer');
const {positiveId} = require('../models/validation');

async function dashboard() {
  return {...await repository.dashboardSummary(), emailConfigured: mailer.isConfigured()};
}

async function accesses(query) {
  const page = Number(query.page || 1);
  const requestedLimit = Number(query.limit || 25);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(requestedLimit) || requestedLimit < 1) {
    throw new DomainError('Página e limite devem ser números inteiros positivos.');
  }
  const limit = Math.min(requestedLimit, 100);
  return repository.listAccesses({limit, offset: (page - 1) * limit});
}

async function updateReservationGuide(admin, rawId, input) {
  const reservationId = positiveId(rawId, 'Reserva');
  const guideId = input?.idGuia === null ? null : positiveId(input?.idGuia, 'Guia');
  const result = await repository.setReservationGuide({
    reservationId,
    guideId,
    adminId: admin.id
  });
  if (!result) throw new DomainError('Reserva não encontrada.', 404);
  if (result.flightReservation) throw new DomainError('Não é possível associar um guia a uma compra de voo.', 409);
  if (result.invalidGuide) throw new DomainError('O guia selecionado não está aprovado.', 400);
  if (result.cancelled) throw new DomainError('Não é possível alterar guia de uma reserva cancelada.', 409);
  return result;
}

async function reservationHistory(rawId) {
  const reservationId = positiveId(rawId, 'Reserva');
  return repository.listReservationHistory(reservationId);
}

async function recentReservationHistory() {
  return repository.listRecentReservationHistory();
}

async function guideApplications() {
  return repository.listGuideApplications();
}

async function emailNotifications() {
  return repository.listEmailNotifications();
}

module.exports = {
  dashboard,
  accesses,
  updateReservationGuide,
  reservationHistory,
  recentReservationHistory,
  guideApplications,
  emailNotifications
};
