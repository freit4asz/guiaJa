const pool = require('../config/database');

async function dashboardSummary() {
  const [[summary]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM reserva) AS compras,
       (SELECT COUNT(*) FROM reserva WHERE status_reserva = 'Confirmada') AS confirmadas,
       (SELECT COUNT(*) FROM reserva WHERE status_reserva = 'Pendente') AS pendentes,
       (SELECT COUNT(*) FROM reserva WHERE status_reserva = 'Cancelada') AS canceladas,
       (SELECT COALESCE(SUM(valor_total), 0) FROM reserva WHERE status_reserva = 'Confirmada') AS faturamento,
       (SELECT COUNT(*) FROM usuario WHERE tipo = 'cliente') AS clientes,
       (SELECT COUNT(*) FROM acesso_site) AS acessos`
  );
  const [purchasesByMonth] = await pool.query(
    'SELECT * FROM vw_compras_por_mes ORDER BY mes DESC LIMIT 12'
  );
  const [topPackages] = await pool.query(
    'SELECT * FROM vw_pacotes_mais_reservados LIMIT 10'
  );
  const [accessesByDay] = await pool.query(
    'SELECT * FROM vw_acessos_por_dia LIMIT 14'
  );
  return {totals: summary, purchasesByMonth, topPackages, accessesByDay};
}

async function listAccesses({limit, offset}) {
  const [rows] = await pool.query(
    `SELECT a.id_acesso AS id, a.metodo, a.caminho, a.status_http AS status,
            a.acessado_em AS data, u.nome AS usuario, u.email
     FROM acesso_site a
     LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
     ORDER BY a.acessado_em DESC, a.id_acesso DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[count]] = await pool.query('SELECT COUNT(*) AS total FROM acesso_site');
  return {items: rows, total: count.total};
}

async function setReservationGuide({reservationId, guideId, adminId}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[reservation]] = await connection.query(
      `SELECT id_reserva AS id, id_guia AS guideId, id_passagem AS flightId, status_reserva AS status
       FROM reserva WHERE id_reserva = ? FOR UPDATE`,
      [reservationId]
    );
    if (!reservation) {
      await connection.rollback();
      return null;
    }

    if (reservation.flightId) {
      await connection.rollback();
      return {flightReservation: true};
    }

    if (guideId !== null) {
      const [[guide]] = await connection.query(
        `SELECT id_guia FROM guia WHERE id_guia = ? AND status_aprovacao = 'aprovado'`,
        [guideId]
      );
      if (!guide) {
        await connection.rollback();
        return {invalidGuide: true};
      }
    }

    if (reservation.status === 'Cancelada') {
      await connection.rollback();
      return {cancelled: true};
    }

    await connection.query('UPDATE reserva SET id_guia = ? WHERE id_reserva = ?', [guideId, reservationId]);
    await connection.query(
      `INSERT INTO historico_reserva
         (id_reserva, id_usuario_admin, acao, detalhes)
       VALUES (?, ?, 'guia_alterado', ?)`,
      [
        reservationId,
        adminId,
        JSON.stringify({guiaAnterior: reservation.guideId, guiaAtual: guideId})
      ]
    );
    await connection.commit();
    return {id: reservationId, idGuia: guideId};
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listReservationHistory(reservationId) {
  const [rows] = await pool.query(
    `SELECT h.id_historico AS id, h.acao, h.detalhes, h.criado_em AS data,
            u.nome AS administrador
     FROM historico_reserva h
     JOIN usuario u ON u.id_usuario = h.id_usuario_admin
     WHERE h.id_reserva = ?
     ORDER BY h.criado_em DESC, h.id_historico DESC`,
    [reservationId]
  );
  return rows;
}

async function listRecentReservationHistory() {
  const [rows] = await pool.query(
    `SELECT h.id_historico AS id, r.codigo_voucher AS voucher, h.acao,
            h.detalhes, h.criado_em AS data, u.nome AS administrador
     FROM historico_reserva h
     JOIN reserva r ON r.id_reserva = h.id_reserva
     JOIN usuario u ON u.id_usuario = h.id_usuario_admin
     ORDER BY h.criado_em DESC, h.id_historico DESC
     LIMIT 50`
  );
  return rows;
}

async function listGuideApplications() {
  const [rows] = await pool.query(
    `SELECT g.id_guia AS id, g.nome, g.email, g.telefone, g.curriculo,
            g.status_aprovacao AS status, e.criado_em AS dataCandidatura,
            e.status AS statusEmail, e.tentativas AS tentativasEmail
     FROM email_outbox e
     JOIN guia g ON g.id_guia = e.id_guia
     ORDER BY e.criado_em DESC, e.id_email DESC`
  );
  return rows;
}

async function listEmailNotifications() {
  const [rows] = await pool.query(
    `SELECT e.id_email AS id, e.destinatario, e.assunto, e.status,
            e.tentativas, e.ultimo_erro AS erro, e.criado_em AS data,
            e.enviado_em AS dataEnvio, r.codigo_voucher AS voucher, g.nome AS candidato
     FROM email_outbox e
     LEFT JOIN reserva r ON r.id_reserva = e.id_reserva
     LEFT JOIN guia g ON g.id_guia = e.id_guia
     ORDER BY e.criado_em DESC, e.id_email DESC
     LIMIT 100`
  );
  return rows;
}

module.exports = {
  dashboardSummary,
  listAccesses,
  setReservationGuide,
  listReservationHistory,
  listRecentReservationHistory,
  listGuideApplications,
  listEmailNotifications
};
