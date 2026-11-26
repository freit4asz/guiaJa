async function enqueue(connection, {
  reservationId = null,
  guideId = null,
  recipient = process.env.ADMIN_EMAIL || null,
  subject,
  text
}) {
  await connection.query(
    `INSERT INTO email_outbox
       (id_reserva, id_guia, destinatario, assunto, conteudo_texto)
     VALUES (?, ?, ?, ?, ?)`,
    [reservationId, guideId, recipient, subject, text]
  );
}

module.exports = {enqueue};
