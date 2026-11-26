const pool = require('../config/database');
const emailRepository = require('./emailRepository');
const DomainError = require('../errors/DomainError');

async function createContact({nome, email, assunto}) {
  await pool.query(
    'INSERT INTO contato (nome, email, assunto, data_envio) VALUES (?, ?, ?, NOW())',
    [nome, email, assunto]
  );
}

async function createGuideApplication({nome, email, curriculo, notification}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO guia (nome, email, curriculo, status_aprovacao)
       VALUES (?, ?, ?, 'pendente')`,
      [nome, email, curriculo]
    );
    await emailRepository.enqueue(connection, {
      guideId: result.insertId,
      ...notification
    });
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createMessage({user, guideId, content, notificationFor}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[guide]] = await connection.query(
      `SELECT nome, email FROM guia
       WHERE id_guia = ? AND status_aprovacao = 'aprovado'
       FOR UPDATE`,
      [guideId]
    );
    if (!guide) throw new DomainError('Guia não encontrado ou indisponível.', 404);
    if (!guide.email) throw new DomainError('Este guia ainda não possui e-mail para receber mensagens.');

    await connection.query(
      'INSERT INTO mensagem_guia (conteudo, data_envio, id_usuario, id_guia) VALUES (?, NOW(), ?, ?)',
      [content, user.id, guideId]
    );
    const notification = notificationFor(guide);
    await emailRepository.enqueue(connection, {
      guideId,
      recipient: guide.email,
      subject: notification.subject,
      text: notification.text
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {createContact, createGuideApplication, createMessage};
