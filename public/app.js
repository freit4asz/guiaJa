/* ===== Funções de apoio (os dados agora vêm do MySQL pelo servidor) ===== */
const $ = (s, r = document) => r.querySelector(s);
const moeda = v => Number(v).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const htmlSeguro = valor => String(valor ?? '').replace(/[&<>"']/g, caractere => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[caractere]));
const dataBrasileira = valor => {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR', {timeZone:'UTC'});
};
const dataHoraBrasileira = valor => {
  if (!valor) return 'Horário não registrado';
  const data = new Date(`${String(valor).replace(' ', 'T')}Z`);
  return Number.isNaN(data.getTime())
    ? 'Horário não registrado'
    : data.toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short', timeZone:'America/Sao_Paulo'});
};
const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const salvar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const usuario = () => sessionStorage.getItem('guiaja.basic') ? ler('sessao', null) : null;
const estrelas = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* Conversa com o servidor: api('/api/pacotes')  ou  api('/api/login', {email, senha}) */
async function api(url, corpo, method = corpo ? 'POST' : 'GET') {
  const headers = {};
  const authorization = sessionStorage.getItem('guiaja.basic');
  if (authorization) headers.Authorization = authorization;
  if (corpo) headers['Content-Type'] = 'application/json';
  const opcoes = {headers};
  if (corpo) {
    opcoes.method = method;
    opcoes.body = JSON.stringify(corpo);
  } else if (method !== 'GET') {
    opcoes.method = method;
  }
  const r = await fetch(url, opcoes);
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro || 'Algo deu errado. Tente de novo.');
  return dados;
}

function mensagem(texto, tipo = 'erro') {
  const m = $('#msg'); m.textContent = texto; m.className = 'msg ' + tipo;
}

const fotosPacotes = {
  1: 'pacote-bonito.jpg',
  2: 'pacote-bariloche.jpg',
  3: 'pacote-lisboa.jpg',
  4: 'pacote-lencois.jpg',
  5: 'pacote-rio.jpg',
  6: 'pacote-foz.jpg'
};

const fotosHospedagens = {
  1: 'hotel-monumental.jpg',
  2: 'hotel-paraiso.jpg',
  3: 'hotel-beira-mar.jpg',
  4: 'hotel-horizonte.jpg',
  5: 'hotel-5.jpg',
  6: 'hotel-6.jpg',
  7: 'hotel-7.jpg',
  8: 'hotel-8.jpg',
  9: 'hotel-9.jpg'
};

function fotoPacote(p) {
  const id = p.idPacote || p.id;
  return fotosPacotes[id] || 'pacote-bonito.jpg';
}

function fotoHospedagem(h) {
  return fotosHospedagens[h.id] || fotosHospedagens[1];
}

function iniciaisGuia(nome) {
  return String(nome || 'Guia').trim().split(/\s+/).slice(0, 2)
    .map(parte => Array.from(parte)[0] || '').join('').toLocaleUpperCase('pt-BR');
}

function cardPacote(p) {
  return `<a class="card" href="pacote.html?id=${p.id}">
    <div class="foto" style="background-image:url('${fotoPacote(p)}')"><span class="foto-destino">${htmlSeguro(p.nome)}</span></div>
    <div class="corpo"><span class="preco-original"><del>${moeda(p.precoOriginal)}</del></span>
    <span class="preco">${moeda(p.preco)}</span><small class="desconto-pacote">${p.descontoPercentual}% de desconto no pacote</small>
    <h3>${htmlSeguro(p.nome)}</h3><p>${htmlSeguro(p.desc)}</p>
    <small>✈ Voo · 🛏 Hotel · 🥾 Atividades · 🧭 Guia</small></div></a>`;
}

/* Cabeçalho e rodapé iguais em todas as páginas */
function layout() {
  const u = usuario();
  $('#topo').outerHTML = `<header class="topo"><div class="barra">
    <a class="logo" href="index.html">Guia<span>Ja</span></a>
    <nav><a href="pacotes.html">Pacotes</a><a href="voos.html">Voos</a><a href="guias.html">Guias</a><a href="hospedagem.html">Hospedagem</a><a href="sobre.html">Sobre Nós</a><a href="contato.html">Contato</a></nav>
    <div class="conta"><button class="carrinho-icone" id="abrir-carrinho" aria-label="Abrir carrinho">🛒 <span id="badge-carrinho">0</span></button>${u ? `${u.tipo === 'admin' ? '<a href="admin.html">Administração</a>' : '<a href="minhas-compras.html">Minhas compras</a>'}<span>Olá, ${u.nome.split(' ')[0]}</span><a href="#" id="sair">Sair</a>`
      : `<a href="login.html">Entrar</a><a class="btn escuro" href="cadastro.html">Cadastrar</a>`}</div></div></header>`;
  $('#rodape').outerHTML = `<footer class="rodape">© 2026 GuiaJa. Todos os direitos reservados.</footer>`;
  const sair = $('#sair');
  if (sair) sair.onclick = e => {
    e.preventDefault();
    localStorage.removeItem('sessao');
    sessionStorage.removeItem('guiaja.basic');
    location.href = 'index.html';
  };
  configurarCarrinho();
  $('#abrir-carrinho').onclick = abrirCarrinho;
}

/* ===== Carrinho e confirmação da compra ===== */
const carrinho = () => ler('carrinho', []);

function salvarCarrinho(itens) {
  salvar('carrinho', itens);
  atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
  const badge = $('#badge-carrinho');
  if (badge) badge.textContent = carrinho().length;
}

function adicionarAoCarrinho(item) {
  salvarCarrinho([item]);
  abrirCarrinho();
}

function removerDoCarrinho() {
  salvarCarrinho([]);
  montarCarrinho();
}

function montarCarrinho() {
  const itens = carrinho();
  const vazio = $('#carrinho-vazio');
  const resumo = $('#carrinho-resumo');
  if (!itens.length) {
    vazio.style.display = 'block';
    resumo.innerHTML = '';
    return;
  }
  vazio.style.display = 'none';
  const item = itens[0];
  const photo = item.tipo === 'hotel' ? item.foto : item.tipo === 'voo' ? '' : fotoPacote(item);
  resumo.innerHTML = `
    <article class="carrinho-item">
      <div class="carrinho-foto" style="${photo ? `background-image:url('${photo}')` : ''}">${item.tipo === 'voo' ? '✈️' : ''}</div>
      <div>
        <h3>${htmlSeguro(item.nome)}</h3>
        ${item.tipo === 'voo'
          ? `<p>${htmlSeguro(item.origem)} → ${htmlSeguro(item.destino)} · ${dataBrasileira(item.dataVoo)}</p>`
          : item.tipo === 'hotel'
          ? `<p>${item.noites} noite(s) · Check-in: ${item.checkin.split('-').reverse().join('/')}</p>`
          : `<p>${item.dias} dias · Ida: ${item.dataIda ? item.dataIda.split('-').reverse().join('/') : 'Não informada'}</p><p>Desconto de ${item.descontoPercentual || 5}% no pacote: − ${moeda(item.desconto || 0)}</p><p>Guia: ${htmlSeguro(item.guiaNome)}</p><p>Hospedagem: ${htmlSeguro(item.hotelNome)}</p>`}
      </div>
      <strong>${moeda(item.total)}</strong>
    </article>
    <div class="carrinho-total"><span>Total da viagem</span><strong>${moeda(item.total)}</strong></div>
    <button class="btn" id="confirmar-compra">Confirmar compra</button>
    <button class="btn claro carrinho-remover" id="remover-carrinho">Remover do carrinho</button>
    <p class="msg" id="carrinho-msg" role="status"></p>`;
  $('#remover-carrinho').onclick = removerDoCarrinho;
  $('#confirmar-compra').onclick = confirmarCompra;
}

function abrirCarrinho() {
  montarCarrinho();
  $('#carrinho-modal').classList.add('aberto');
}

function fecharCarrinho() {
  $('#carrinho-modal').classList.remove('aberto');
}

async function confirmarCompra() {
  const u = usuario();
  if (!u) {
    fecharCarrinho();
    location.href = 'login.html';
    return;
  }
  const item = carrinho()[0];
  if (!item) return;
  const botao = $('#confirmar-compra');
  botao.disabled = true;
  try {
    const r = await api('/api/reservas', {
      tipo: item.tipo || 'pacote',
      idPacote: item.idPacote,
      idPassagem: item.idPassagem,
      idGuia: item.idGuia,
      idHospedagem: item.idHospedagem,
      dataIda: item.tipo === 'hotel' ? item.checkin : item.dataIda,
      noites: item.noites
    });
    salvarCarrinho([]);
    $('#carrinho-resumo').innerHTML = `
      <div class="msg ok">Compra confirmada!<br><strong>Voucher: ${r.codigo}</strong><br>Data e hora da compra: ${dataHoraBrasileira(r.dataHoraCompra)}${r.discount ? `<br>Desconto do pacote: ${moeda(r.discount)}` : ''}<br>Total: ${moeda(r.total)}</div>
      <a class="btn" href="minhas-compras.html?id=${encodeURIComponent(r.id)}">Ver compra completa</a>
      <button class="btn claro carrinho-remover" id="continuar">Continuar compras</button>`;
    $('#continuar').onclick = () => { fecharCarrinho(); location.href = item.tipo === 'voo' ? 'voos.html' : 'pacotes.html'; };
  } catch (e) {
    const msg = $('#carrinho-msg');
    msg.textContent = e.message;
    msg.className = 'msg erro';
  } finally {
    if ($('#confirmar-compra')) botao.disabled = false;
  }
}

function configurarCarrinho() {
  if (!$('#carrinho-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="carrinho-modal" id="carrinho-modal" role="dialog" aria-modal="true" aria-labelledby="carrinho-titulo">
        <div class="carrinho-painel">
          <div class="carrinho-cabecalho"><h2 id="carrinho-titulo">Meu carrinho</h2><button id="fechar-carrinho" aria-label="Fechar carrinho">×</button></div>
          <p id="carrinho-vazio" class="carrinho-vazio">Seu carrinho está vazio.</p>
          <div id="carrinho-resumo"></div>
        </div>
      </div>`);
  }
  $('#fechar-carrinho').onclick = fecharCarrinho;
  $('#carrinho-modal').onclick = e => { if (e.target.id === 'carrinho-modal') fecharCarrinho(); };
  atualizarBadgeCarrinho();
}
