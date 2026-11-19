// Servidor do GuiaJa: entrega o site (pasta public) e conversa com o MySQL.
// Rodar: npm install  e depois  npm start  -> http://localhost:3000
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(linha => {
    const indice = linha.indexOf('=');
    if (indice > 0) {
      const chave = linha.slice(0, indice).trim();
      const valor = linha.slice(indice + 1).trim();
      if (chave && process.env[chave] === undefined) process.env[chave] = valor;
    }
  });
}

const bancoConfigurado = Boolean(
  process.env.MYSQL_URL ||
  (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER)
);

const pool = process.env.MYSQL_URL
  ? mysql.createPool(process.env.MYSQL_URL)
  : mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'guiaja',
      ssl: process.env.MYSQL_SSL === 'true' ? {rejectUnauthorized: true} : undefined,
      decimalNumbers: true
    });

const hash = s => crypto.createHash('sha256').update(s).digest('hex'); // igual ao SHA2(...,256) do banco
const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
// Evita que um erro de banco derrube o servidor
const rota = fn => (req, res) => fn(req, res).catch(e => {
  console.error(`Erro na API ${req.method} ${req.originalUrl}:`, e.code || 'SEM_CODIGO', e.message);
  res.status(500).json({erro: 'Erro no servidor. Veja o terminal.'});
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', async (req, res) => {
  if (!bancoConfigurado) {
    return res.status(503).json({ok: false, erro: 'Variaveis do banco nao configuradas'});
  }
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ok: true});
  } catch (e) {
    console.error('Erro no health check do banco:', e.code || 'SEM_CODIGO', e.message);
    res.status(503).json({ok: false, erro: 'Banco indisponivel'});
  }
});

// ---------- Consultas ----------
app.get('/api/pacotes', rota(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id_pacote AS id, nome, tipo, descricao AS \`desc\`, duracao_dias AS dias, preco, emoji, cor_fundo AS cor
     FROM pacote WHERE ativo = TRUE ORDER BY id_pacote`);
  res.json(rows);
}));

app.get('/api/pacotes/:id', rota(async (req, res) => {
  const [[p]] = await pool.query(
    `SELECT id_pacote AS id, nome, tipo, duracao_dias AS dias, preco FROM pacote WHERE id_pacote = ? AND ativo = TRUE`, [req.params.id]);
  if (!p) return res.status(404).json({erro: 'Pacote não encontrado'});
  const [r] = await pool.query(`SELECT descricao FROM roteiro_pacote WHERE id_pacote = ? ORDER BY dia`, [p.id]);
  p.roteiro = r.map(x => x.descricao);
  res.json(p);
}));

app.get('/api/guias', rota(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.id_guia AS id, g.nome, g.avaliacao AS nota, g.qtd_avaliacoes AS avaliacoes,
            g.valor_hora AS valorHora, g.anos_experiencia AS exp, g.tag_status AS tag,
            GROUP_CONCAT(i.nome) AS idiomas
     FROM guia g JOIN guia_idioma gi ON gi.id_guia = g.id_guia JOIN idioma i ON i.id_idioma = gi.id_idioma
     WHERE g.status_aprovacao = 'aprovado' GROUP BY g.id_guia ORDER BY g.id_guia`);
  res.json(rows.map(g => ({...g, idiomas: g.idiomas.split(',')})));
}));

app.get('/api/hoteis', rota(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT h.id_hospedagem AS id, h.nome, CONCAT(d.cidade, ', ', d.estado) AS \`local\`,
            h.avaliacao AS nota, h.qtd_avaliacoes AS aval, h.preco_diaria AS diaria
     FROM hospedagem h JOIN destino d ON d.id_destino = h.id_destino ORDER BY h.id_hospedagem`);
  res.json(rows);
}));

// ---------- Cadastro e login ----------
app.post('/api/cadastro', rota(async (req, res) => {
  const {nome, email, telefone, senha} = req.body;
  if (!nome || !email || !telefone || !senha) return res.status(400).json({erro: 'Preencha todos os campos.'});
  if (!emailValido(email)) return res.status(400).json({erro: 'Digite um e-mail válido.'});
  if (senha.length < 8) return res.status(400).json({erro: 'A senha precisa ter pelo menos 8 caracteres.'});
  try {
    await pool.query(`INSERT INTO usuario (nome, email, telefone, senha, data_cadastro) VALUES (?,?,?,?,CURDATE())`,
      [nome, email.toLowerCase(), telefone, hash(senha)]);
    res.json({ok: true});
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({erro: 'Este e-mail já está cadastrado.'});
    throw e;
  }
}));

app.post('/api/login', rota(async (req, res) => {
  const {email, senha} = req.body;
  const [[u]] = await pool.query(
    `SELECT id_usuario AS id, nome, email, bloqueado FROM usuario WHERE email = ? AND senha = ?`,
    [(email || '').toLowerCase(), hash(senha || '')]);
  if (!u) return res.status(401).json({erro: 'E-mail ou senha incorretos.'});
  if (u.bloqueado) return res.status(403).json({erro: 'Conta bloqueada. Fale com o suporte.'});
  res.json({id: u.id, nome: u.nome, email: u.email});
}));

// ---------- Reserva (o total é calculado aqui, no servidor) ----------
app.post('/api/reservas', rota(async (req, res) => {
  const {tipo, idUsuario, idPacote, idGuia, idHospedagem, dataIda, noites} = req.body;
  if (!idUsuario) return res.status(401).json({erro: 'Faça login para reservar.'});
  if (!dataIda || dataIda < new Date().toISOString().slice(0, 10))
    return res.status(400).json({erro: 'Escolha uma data que não seja no passado.'});

  if (tipo === 'hotel') {
    const [[h]] = await pool.query(`SELECT preco_diaria FROM hospedagem WHERE id_hospedagem = ?`, [idHospedagem]);
    if (!h) return res.status(400).json({erro: 'Hospedagem inválida.'});
    const quantidadeNoites = Math.max(1, Math.min(30, Number(noites) || 1));
    const total = h.preco_diaria * quantidadeNoites;
    const codigo = 'GJ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    await pool.query(
      `INSERT INTO reserva (codigo_voucher, data_reserva, data_ida, valor_total, status_reserva, id_usuario, id_pacote, id_guia, id_hospedagem)
       VALUES (?, CURDATE(), ?, ?, 'Confirmada', ?, NULL, NULL, ?)`,
      [codigo, dataIda, total.toFixed(2), idUsuario, idHospedagem]);
    return res.json({codigo, total});
  }

  const [[p]] = await pool.query(`SELECT preco, duracao_dias FROM pacote WHERE id_pacote = ? AND ativo = TRUE`, [idPacote]);
  const [[g]] = await pool.query(`SELECT valor_hora FROM guia WHERE id_guia = ? AND status_aprovacao = 'aprovado'`, [idGuia]);
  if (!p || !g) return res.status(400).json({erro: 'Pacote ou guia inválidos.'});

  let hotelTotal = 0;
  if (idHospedagem) {
    const [[h]] = await pool.query(`SELECT preco_diaria FROM hospedagem WHERE id_hospedagem = ?`, [idHospedagem]);
    if (!h) return res.status(400).json({erro: 'Hospedagem inválida.'});
    hotelTotal = h.preco_diaria * p.duracao_dias;
  }
  const total = p.preco + hotelTotal + g.valor_hora * 4 * p.duracao_dias;
  const codigo = 'GJ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  await pool.query(
    `INSERT INTO reserva (codigo_voucher, data_reserva, data_ida, valor_total, status_reserva, id_usuario, id_pacote, id_guia, id_hospedagem)
     VALUES (?, CURDATE(), ?, ?, 'Confirmada', ?, ?, ?, ?)`,
    [codigo, dataIda, total.toFixed(2), idUsuario, idPacote, idGuia, idHospedagem || null]);
  res.json({codigo, total});
}));

// ---------- Contato, mensagens e novos guias ----------
app.post('/api/contato', rota(async (req, res) => {
  const {nome, email, assunto} = req.body;
  if (!nome || !assunto || !emailValido(email)) return res.status(400).json({erro: 'Preencha os campos corretamente.'});
  await pool.query(`INSERT INTO contato (nome, email, assunto, data_envio) VALUES (?,?,?,NOW())`, [nome, email, assunto]);
  res.json({ok: true});
}));

app.post('/api/guias/candidatura', rota(async (req, res) => {
  const {nome, email, curriculo} = req.body;
  if (!nome || !curriculo || !emailValido(email)) return res.status(400).json({erro: 'Preencha os campos corretamente.'});
  await pool.query(`INSERT INTO guia (nome, email, curriculo, status_aprovacao) VALUES (?,?,?,'pendente')`, [nome, email, curriculo]);
  res.json({ok: true});
}));

app.post('/api/mensagens', rota(async (req, res) => {
  const {idUsuario, idGuia, conteudo} = req.body;
  if (!idUsuario || !idGuia || !conteudo) return res.status(400).json({erro: 'Dados incompletos.'});
  await pool.query(`INSERT INTO mensagem_guia (conteudo, data_envio, id_usuario, id_guia) VALUES (?,NOW(),?,?)`, [conteudo, idUsuario, idGuia]);
  res.json({ok: true});
}));

pool.query('ALTER TABLE reserva MODIFY id_pacote INT NULL')
  .catch(e => console.error('Não foi possível ajustar reserva.id_pacote:', e.message));

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`GuiaJa rodando na porta ${port}`));
