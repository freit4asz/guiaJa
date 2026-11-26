const pool = require('../config/database');

async function findByEmail(email) {
  const [[user]] = await pool.query(
    `SELECT id_usuario AS id, nome, email, senha, tipo, bloqueado
     FROM usuario WHERE email = ?`,
    [email]
  );
  return user;
}

async function create({nome, email, telefone, senhaHash}) {
  const [result] = await pool.query(
    `INSERT INTO usuario (nome, email, telefone, senha, data_cadastro)
     VALUES (?, ?, ?, ?, CURDATE())`,
    [nome, email, telefone, senhaHash]
  );
  return result.insertId;
}

async function updatePasswordHash(id, senhaHash) {
  await pool.query('UPDATE usuario SET senha = ? WHERE id_usuario = ?', [senhaHash, id]);
}

async function findProfileById(id) {
  const [[profile]] = await pool.query(
    `SELECT id_usuario AS id, nome, email, telefone, tipo, data_cadastro AS dataCadastro
     FROM usuario WHERE id_usuario = ?`,
    [id]
  );
  return profile;
}

async function updateProfile(id, {nome, telefone}) {
  await pool.query(
    'UPDATE usuario SET nome = ?, telefone = ? WHERE id_usuario = ?',
    [nome, telefone, id]
  );
  return findProfileById(id);
}

module.exports = {findByEmail, create, updatePasswordHash, findProfileById, updateProfile};
