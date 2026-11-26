const pool = require('../config/database');
const mailer = require('../config/mailer');

let running = false;
let started = false;

async function deliverPending(transporter) {
  if (running) return;
  running = true;
  try {
    await pool.query(
      `UPDATE email_outbox SET status = 'pendente'
       WHERE status = 'enviando' AND atualizado_em < NOW() - INTERVAL 10 MINUTE`
    );
    const [messages] = await pool.query(
      `SELECT id_email, destinatario, assunto, conteudo_texto, tentativas
       FROM email_outbox
       WHERE status = 'pendente'
       ORDER BY criado_em, id_email
       LIMIT 10`
    );

    for (const message of messages) {
      const [claim] = await pool.query(
        `UPDATE email_outbox SET status = 'enviando'
         WHERE id_email = ? AND status = 'pendente'`,
        [message.id_email]
      );
      if (!claim.affectedRows) continue;

      const recipient = message.destinatario || process.env.ADMIN_EMAIL;
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipient,
          subject: message.assunto,
          text: message.conteudo_texto
        });
        await pool.query(
          `UPDATE email_outbox
           SET destinatario = ?, status = 'enviado', enviado_em = NOW(), ultimo_erro = NULL
           WHERE id_email = ?`,
          [recipient, message.id_email]
        );
      } catch (error) {
        const attempts = message.tentativas + 1;
        const status = attempts >= 5 ? 'falhou' : 'pendente';
        await pool.query(
          `UPDATE email_outbox
           SET destinatario = ?, status = ?, tentativas = ?, ultimo_erro = ?
           WHERE id_email = ?`,
          [recipient, status, attempts, String(error.message).slice(0, 1000), message.id_email]
        );
        console.error(`Falha ao enviar notificação ${message.id_email}:`, error.code || error.message);
      }
    }
  } catch (error) {
    console.error('Não foi possível processar a fila de e-mails:', error.code || error.message);
  } finally {
    running = false;
  }
}

function startEmailWorker() {
  if (started) return;
  started = true;

  const transporter = mailer.createTransporter();
  if (!transporter) {
    console.warn('SMTP/ADMIN_EMAIL não configurados; notificações ficam na fila do banco.');
    return;
  }

  deliverPending(transporter);
  const interval = setInterval(() => deliverPending(transporter), 30000);
  interval.unref();
}

module.exports = {startEmailWorker, deliverPending};
