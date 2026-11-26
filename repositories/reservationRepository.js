const pool = require('../config/database');
const emailRepository = require('./emailRepository');

async function findPackage(id) {
  const [[row]] = await pool.query(
    `SELECT p.nome, p.preco, p.duracao_dias, p.id_destino AS idDestino,
            d.cidade, d.estado, d.pais
     FROM pacote p
     JOIN destino d ON d.id_destino = p.id_destino
     WHERE p.id_pacote = ? AND p.ativo = TRUE`, [id]
  );
  return row;
}

async function findGuide(id) {
  const [[row]] = await pool.query(
    `SELECT nome, valor_hora FROM guia
     WHERE id_guia = ? AND status_aprovacao = 'aprovado'`, [id]
  );
  return row;
}

async function findHotel(id) {
  const [[row]] = await pool.query(
    `SELECT h.nome, h.preco_diaria, h.id_destino AS idDestino,
            d.cidade, d.estado, d.pais
     FROM hospedagem h JOIN destino d ON d.id_destino = h.id_destino
     WHERE h.id_hospedagem = ?`, [id]
  );
  return row;
}

async function findFlight(id) {
  const [[row]] = await pool.query(
    `SELECT origem, destino_voo, DATE_FORMAT(data_voo, '%Y-%m-%d') AS data_voo, preco
     FROM passagem WHERE id_passagem = ?`, [id]
  );
  return row;
}

async function create({codigo, dataIda, total, userId, packageId, flightId, guideId, hotelId, packageOriginal, discount, notification}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO reserva
         (codigo_voucher, data_reserva, data_hora_reserva, data_ida, valor_total, valor_pacote_original, valor_desconto,
          status_reserva, id_usuario, id_pacote, id_guia, id_hospedagem, id_passagem)
       VALUES (?, CURDATE(), UTC_TIMESTAMP(), ?, ?, ?, ?, 'Confirmada', ?, ?, ?, ?, ?)`,
      [codigo, dataIda, total.toFixed(2), packageOriginal.toFixed(2), discount.toFixed(2),
        userId, packageId, guideId, hotelId, flightId]
    );
    const [[reservation]] = await connection.query(
      `SELECT data_reserva AS dataCompra,
              DATE_FORMAT(data_hora_reserva, '%Y-%m-%d %H:%i:%s') AS dataHoraCompra
       FROM reserva WHERE id_reserva = ?`,
      [result.insertId]
    );
    const [topPackages] = await connection.query(
      'SELECT pacote, total_reservas FROM vw_pacotes_mais_reservados LIMIT 5'
    );
    const topPackagesText = topPackages.length
      ? topPackages.map((item, index) => `${index + 1}. ${item.pacote} (${item.total_reservas} reservas)`).join('\n')
      : 'Nenhuma reserva de pacote registrada.';
    const purchaseDate = reservation.dataCompra instanceof Date
      ? reservation.dataCompra.toISOString().slice(0, 10)
      : String(reservation.dataCompra).slice(0, 10);
    const purchaseDateTime = new Date(`${reservation.dataHoraCompra.replace(' ', 'T')}Z`)
      .toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'});
    await emailRepository.enqueue(connection, {
      reservationId: result.insertId,
      ...notification,
      text: `${notification.text}\nData da compra: ${purchaseDate}\nData e hora da compra: ${purchaseDateTime} (Horário de Brasília)\n\nPacotes mais reservados:\n${topPackagesText}`
    });
    await connection.commit();
    return {
      id: result.insertId,
      codigo,
      total,
      packageOriginal,
      discount,
      dataCompra: reservation.dataCompra,
      dataHoraCompra: reservation.dataHoraCompra
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findMatching(where, params) {
  const [rows] = await pool.query(
    `SELECT r.id_reserva AS id, r.codigo_voucher AS codigo,
          r.data_reserva AS dataCompra, r.data_ida AS dataIda,
          DATE_FORMAT(r.data_hora_reserva, '%Y-%m-%d %H:%i:%s') AS dataHoraCompra,
           r.valor_total AS total, r.valor_pacote_original AS valorPacoteOriginal,
           r.valor_desconto AS valorDesconto, r.status_reserva AS status, r.id_usuario AS idUsuario,
           r.id_passagem AS idPassagem,
           r.id_guia AS idGuia,
          u.nome AS cliente, u.email AS emailCliente, p.nome AS pacote, p.tipo AS tipoPacote,
          p.descricao AS descricaoPacote, p.duracao_dias AS duracaoDias,
          COALESCE(d.cidade, dh.cidade) AS cidade,
          COALESCE(d.estado, dh.estado) AS estado,
          COALESCE(d.pais, dh.pais) AS pais,
          g.nome AS guia, g.especialidade AS especialidadeGuia,
          g.valor_hora AS valorHoraGuia, dg.cidade AS cidadeGuia,
          dg.estado AS estadoGuia, dg.pais AS paisGuia, h.nome AS hospedagem,
          h.endereco AS enderecoHospedagem, h.preco_diaria AS diariaHospedagem,
          f.origem AS origemVoo, f.destino_voo AS destinoVoo, f.data_voo AS dataVoo,
          CASE WHEN r.id_passagem IS NOT NULL THEN 'voo'
               WHEN r.id_pacote IS NOT NULL THEN 'pacote' ELSE 'hotel' END AS tipoCompra,
          (SELECT GROUP_CONCAT(rp.descricao ORDER BY rp.dia SEPARATOR '||')
             FROM roteiro_pacote rp WHERE rp.id_pacote = r.id_pacote) AS roteiro,
          (SELECT pg.status_pagamento FROM pagamento pg
             WHERE pg.id_reserva = r.id_reserva
             ORDER BY pg.data_pagamento DESC, pg.id_pagamento DESC LIMIT 1) AS statusPagamento
     FROM reserva r
    JOIN usuario u ON u.id_usuario = r.id_usuario
     LEFT JOIN pacote p ON p.id_pacote = r.id_pacote
    LEFT JOIN destino d ON d.id_destino = p.id_destino
     LEFT JOIN guia g ON g.id_guia = r.id_guia
    LEFT JOIN destino dg ON dg.id_destino = g.id_destino
     LEFT JOIN hospedagem h ON h.id_hospedagem = r.id_hospedagem
    LEFT JOIN destino dh ON dh.id_destino = h.id_destino
    LEFT JOIN passagem f ON f.id_passagem = r.id_passagem
     ${where} ORDER BY r.id_reserva DESC`,
    params
  );
  return rows.map(row => ({...row, roteiro: row.roteiro ? row.roteiro.split('||') : []}));
}

async function listForUser(userId, isAdmin) {
  return findMatching(isAdmin ? '' : 'WHERE r.id_usuario = ?', isAdmin ? [] : [userId]);
}

async function findDetails(id) {
  const rows = await findMatching('WHERE r.id_reserva = ?', [id]);
  return rows[0] || null;
}

async function findById(id) {
  const [[row]] = await pool.query(
    `SELECT id_reserva AS id, id_usuario AS idUsuario, id_passagem AS idPassagem,
            data_ida AS dataIda, status_reserva AS status
     FROM reserva WHERE id_reserva = ?`, [id]
  );
  return row;
}

async function updateDate(id, dataIda) {
  const [result] = await pool.query(
    `UPDATE reserva SET data_ida = ? WHERE id_reserva = ? AND status_reserva <> 'Cancelada'`,
    [dataIda, id]
  );
  return result.affectedRows > 0;
}

async function cancel(id) {
  const [result] = await pool.query(
    `UPDATE reserva SET status_reserva = 'Cancelada'
     WHERE id_reserva = ? AND status_reserva <> 'Cancelada'`, [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findPackage,
  findGuide,
  findHotel,
  findFlight,
  create,
  listForUser,
  findDetails,
  findById,
  updateDate,
  cancel
};
