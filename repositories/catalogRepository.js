const pool = require('../config/database');
const {getResource} = require('../models/catalogResources');
const {PACKAGE_DISCOUNT_PERCENT, packagePrice} = require('../models/pricing');

async function listPackages() {
  const [rows] = await pool.query(
    `SELECT p.id_pacote AS id, p.id_destino AS idDestino, p.nome, p.tipo,
            p.descricao AS \`desc\`, p.duracao_dias AS dias, p.preco, p.emoji,
            p.cor_fundo AS cor, d.cidade, d.estado, d.pais
     FROM pacote p JOIN destino d ON d.id_destino = p.id_destino
     WHERE p.ativo = TRUE ORDER BY p.id_pacote`
  );
  return rows.map(row => {
    const price = packagePrice(row.preco);
    return {
      ...row,
      precoOriginal: price.original,
      preco: price.discounted,
      desconto: price.discount,
      descontoPercentual: PACKAGE_DISCOUNT_PERCENT
    };
  });
}

async function packageDetails(id) {
  const [[item]] = await pool.query(
    `SELECT p.id_pacote AS id, p.id_destino AS idDestino, p.nome, p.tipo,
            p.descricao AS \`desc\`, p.duracao_dias AS dias, p.preco, p.emoji,
            d.cidade, d.estado, d.pais
     FROM pacote p
     JOIN destino d ON d.id_destino = p.id_destino
     WHERE p.id_pacote = ? AND p.ativo = TRUE`, [id]
  );
  if (!item) return null;
  const price = packagePrice(item.preco);
  item.precoOriginal = price.original;
  item.preco = price.discounted;
  item.desconto = price.discount;
  item.descontoPercentual = PACKAGE_DISCOUNT_PERCENT;
  const [itinerary] = await pool.query(
    'SELECT descricao FROM roteiro_pacote WHERE id_pacote = ? ORDER BY dia', [id]
  );
  item.roteiro = itinerary.map(row => row.descricao);
  return item;
}

async function listGuides() {
  const [rows] = await pool.query(
    `SELECT g.id_guia AS id, g.nome, g.avaliacao AS nota, g.qtd_avaliacoes AS avaliacoes,
            g.valor_hora AS valorHora, g.anos_experiencia AS exp, g.tag_status AS tag,
            GROUP_CONCAT(i.nome) AS idiomas,
            CONCAT_WS(', ', d.cidade, d.estado, d.pais) AS local
     FROM guia g
     LEFT JOIN guia_idioma gi ON gi.id_guia = g.id_guia
     LEFT JOIN idioma i ON i.id_idioma = gi.id_idioma
     LEFT JOIN destino d ON d.id_destino = g.id_destino
     WHERE g.status_aprovacao = 'aprovado'
     GROUP BY g.id_guia, d.cidade, d.estado, d.pais
     ORDER BY g.id_guia`
  );
  return rows.map(guide => ({...guide, idiomas: (guide.idiomas || '').split(',').filter(Boolean)}));
}

async function listHotels() {
  const [rows] = await pool.query(
    `SELECT h.id_hospedagem AS id, h.id_destino AS idDestino, h.nome, h.endereco,
            CONCAT(d.cidade, ', ', d.estado) AS \`local\`,
            h.avaliacao AS nota, h.qtd_avaliacoes AS aval, h.preco_diaria AS diaria
     FROM hospedagem h JOIN destino d ON d.id_destino = h.id_destino ORDER BY h.id_hospedagem`
  );
  return rows;
}

async function listFlights() {
  const [rows] = await pool.query(
    `SELECT id_passagem AS id, origem, destino_voo AS destino,
            DATE_FORMAT(data_voo, '%Y-%m-%d') AS dataVoo, preco
     FROM passagem
     WHERE data_voo >= CURDATE()
     ORDER BY data_voo, id_passagem`
  );
  return rows;
}

async function list(name) {
  const resource = getResource(name);
  const [rows] = await pool.query(`SELECT * FROM \`${resource.table}\` ORDER BY \`${resource.id}\``);
  return rows;
}

async function find(name, id) {
  const resource = getResource(name);
  const [[row]] = await pool.query(
    `SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [id]
  );
  return row;
}

async function create(name, data) {
  const resource = getResource(name);
  const fields = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO \`${resource.table}\` (${fields.map(field => `\`${field}\``).join(', ')})
     VALUES (${fields.map(() => '?').join(', ')})`,
    fields.map(field => data[field])
  );
  return find(name, result.insertId);
}

async function update(name, id, data) {
  const resource = getResource(name);
  const fields = Object.keys(data);
  await pool.query(
    `UPDATE \`${resource.table}\` SET ${fields.map(field => `\`${field}\` = ?`).join(', ')}
     WHERE \`${resource.id}\` = ?`,
    [...fields.map(field => data[field]), id]
  );
  return find(name, id);
}

async function remove(name, id) {
  const resource = getResource(name);
  if (resource.softDelete) {
    const [field, value] = resource.softDelete;
    const [result] = await pool.query(
      `UPDATE \`${resource.table}\` SET \`${field}\` = ? WHERE \`${resource.id}\` = ?`,
      [value, id]
    );
    return result.affectedRows > 0;
  }
  const [result] = await pool.query(
    `DELETE FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listPackages,
  packageDetails,
  listGuides,
  listHotels,
  listFlights,
  list,
  find,
  create,
  update,
  remove
};
