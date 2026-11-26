const crypto = require('crypto');
const DomainError = require('../errors/DomainError');
const repository = require('../repositories/reservationRepository');
const notificationContent = require('./notificationContent');
const mailer = require('../config/mailer');
const {packagePrice} = require('../models/pricing');
const {positiveId, validDate} = require('../models/validation');

async function create(user, input) {
  if (!user) throw new DomainError('Autenticação necessária.', 401);
  const {tipo = 'pacote', idPacote, idPassagem, idGuia, idHospedagem, dataIda, noites} = input || {};

  let packageId = null;
  let flightId = null;
  let guideId = null;
  let hotelId = null;
  let total = 0;
  let packageOriginal = 0;
  let discount = 0;
  let departureDate;
  let purchaseName;
  let destination;
  let flightRoute = null;
  let guideName = null;
  let hotelName = null;

  if (tipo === 'voo') {
    flightId = positiveId(idPassagem, 'Voo');
    const flight = await repository.findFlight(flightId);
    if (!flight) throw new DomainError('Voo inválido ou indisponível.');
    const flightDate = flight.data_voo instanceof Date
      ? flight.data_voo.toISOString().slice(0, 10)
      : String(flight.data_voo).slice(0, 10);
    departureDate = validDate(flightDate, 'Data do voo');
    if (departureDate < new Date().toISOString().slice(0, 10)) {
      throw new DomainError('Este voo já não está disponível.');
    }
    total = Number(flight.preco);
    flightRoute = `${flight.origem} → ${flight.destino_voo}`;
    purchaseName = `Voo ${flightRoute}`;
    destination = flight.destino_voo;
  } else {
    departureDate = validDate(dataIda, tipo === 'hotel' ? 'Data de check-in' : 'Data de ida');
    if (departureDate < new Date().toISOString().slice(0, 10)) {
      throw new DomainError('Escolha uma data que não seja no passado.');
    }
  }

  if (tipo === 'hotel') {
    hotelId = positiveId(idHospedagem, 'Hospedagem');
    const hotel = await repository.findHotel(hotelId);
    if (!hotel) throw new DomainError('Hospedagem inválida.');
    const numberOfNights = Number(noites);
    if (!Number.isInteger(numberOfNights) || numberOfNights < 1 || numberOfNights > 30) {
      throw new DomainError('A reserva deve ter entre 1 e 30 noites.');
    }
    total = hotel.preco_diaria * numberOfNights;
    purchaseName = hotel.nome;
    destination = [hotel.cidade, hotel.estado, hotel.pais].filter(Boolean).join(', ');
    hotelName = hotel.nome;
  } else if (tipo === 'pacote') {
    packageId = positiveId(idPacote, 'Pacote');
    guideId = idGuia === null || idGuia === undefined || idGuia === '' ? null : positiveId(idGuia, 'Guia');
    const [travelPackage, guide] = await Promise.all([
      repository.findPackage(packageId),
      guideId ? repository.findGuide(guideId) : null
    ]);
    if (!travelPackage || (guideId && !guide)) throw new DomainError('Pacote ou guia inválidos.');
    const price = packagePrice(travelPackage.preco);
    packageOriginal = price.original;
    discount = price.discount;
    total = price.discounted + (guide ? guide.valor_hora * 4 * travelPackage.duracao_dias : 0);
    purchaseName = travelPackage.nome;
    destination = [travelPackage.cidade, travelPackage.estado, travelPackage.pais].filter(Boolean).join(', ');
    guideName = guide?.nome || null;

    if (idHospedagem !== null && idHospedagem !== undefined && idHospedagem !== '') {
      hotelId = positiveId(idHospedagem, 'Hospedagem');
      const hotel = await repository.findHotel(hotelId);
      if (!hotel) throw new DomainError('Hospedagem inválida.');
      if (Number(hotel.idDestino) !== Number(travelPackage.idDestino)) {
        throw new DomainError('A hospedagem deve estar na mesma cidade do pacote.');
      }
      total += hotel.preco_diaria * travelPackage.duracao_dias;
      hotelName = hotel.nome;
    }
  } else if (tipo !== 'voo') {
    throw new DomainError('Tipo de reserva inválido.');
  }

  const codigo = `GJ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const notification = notificationContent.purchase({
    user,
    codigo,
    dataIda: departureDate,
    packageName: purchaseName,
    destination,
    guideName,
    hotelName,
    total,
    packageOriginal,
    discount,
    flightRoute
  });
  const reservation = await repository.create({
    codigo,
    dataIda: departureDate,
    total,
    userId: user.id,
    packageId,
    flightId,
    guideId,
    hotelId,
    packageOriginal,
    discount,
    notification
  });
  return {
    ...reservation,
    emailStatus: mailer.isConfigured() ? 'pendente' : 'aguardando_configuracao'
  };
}

async function list(user) {
  return repository.listForUser(user.id, user.tipo === 'admin');
}

async function getDetails(user, rawId) {
  const id = positiveId(rawId, 'Reserva');
  const reservation = await repository.findDetails(id);
  if (!reservation || (user.tipo !== 'admin' && reservation.idUsuario !== user.id)) {
    throw new DomainError('Compra não encontrada.', 404);
  }
  return reservation;
}

async function update(user, rawId, input) {
  const id = positiveId(rawId, 'Reserva');
  const reservation = await repository.findById(id);
  if (!reservation) throw new DomainError('Reserva não encontrada.', 404);
  if (user.tipo !== 'admin' && reservation.idUsuario !== user.id) throw new DomainError('Acesso negado.', 403);
  if (!input || Object.keys(input).some(key => key !== 'dataIda') || !input.dataIda) {
    throw new DomainError('Informe apenas a nova dataIda.');
  }
  if (reservation.idPassagem) {
    throw new DomainError('A data de uma passagem aérea não pode ser alterada. Cancele a compra e selecione outro voo.', 409);
  }
  const departureDate = validDate(input.dataIda, 'Data de ida');
  if (departureDate < new Date().toISOString().slice(0, 10)) {
    throw new DomainError('Escolha uma data que não seja no passado.');
  }
  if (reservation.status === 'Cancelada') throw new DomainError('Não é possível alterar uma reserva cancelada.', 409);
  await repository.updateDate(id, departureDate);
  return {id, dataIda: departureDate};
}

async function cancel(user, rawId) {
  const id = positiveId(rawId, 'Reserva');
  const reservation = await repository.findById(id);
  if (!reservation) throw new DomainError('Reserva não encontrada.', 404);
  if (user.tipo !== 'admin' && reservation.idUsuario !== user.id) throw new DomainError('Acesso negado.', 403);
  if (reservation.status === 'Cancelada') throw new DomainError('A reserva já está cancelada.', 409);
  await repository.cancel(id);
}

module.exports = {create, list, getDetails, update, cancel};
