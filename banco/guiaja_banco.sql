-- =====================================================================
-- GuiaJa - Banco de dados completo (estrutura + dados de exemplo)
-- Para MySQL Workbench (MySQL 5.7 ou 8). Rode o arquivo inteiro:
-- Menu Query > Execute (ícone do raio), com este arquivo aberto.
-- ATENÇÃO: o script recria o banco "guiaja" do zero (apaga o anterior).
-- =====================================================================

DROP DATABASE IF EXISTS guiaja;
CREATE DATABASE guiaja CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE guiaja;

-- ---------------------------------------------------------------------
-- 1. ESTRUTURA DAS TABELAS
-- ---------------------------------------------------------------------

CREATE TABLE destino (
  id_destino  INT AUTO_INCREMENT PRIMARY KEY,
  cidade      VARCHAR(100) NOT NULL,
  estado      VARCHAR(100),
  pais        VARCHAR(100) NOT NULL,
  descricao   TEXT
) ENGINE=InnoDB;

CREATE TABLE usuario (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,      -- e-mail único (RF-01.1)
  telefone       VARCHAR(20),
  senha          VARCHAR(255) NOT NULL,             -- guarda o hash, nunca a senha pura
  tipo           ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  bloqueado      BOOLEAN NOT NULL DEFAULT FALSE,    -- admin pode bloquear (backlog)
  data_cadastro  DATE NOT NULL
) ENGINE=InnoDB;

CREATE TABLE idioma (
  id_idioma  INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE guia (
  id_guia            INT AUTO_INCREMENT PRIMARY KEY,
  nome               VARCHAR(100) NOT NULL,
  email              VARCHAR(100),
  telefone           VARCHAR(20),
  especialidade      VARCHAR(100),
  curriculo          TEXT,
  valor_hora         DECIMAL(8,2),
  anos_experiencia   INT,
  avaliacao          DECIMAL(3,2) DEFAULT 0,
  qtd_avaliacoes     INT DEFAULT 0,
  tag_status         VARCHAR(30),                   -- "Mais escolhido", "Disponível agora"
  status_aprovacao   ENUM('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
  id_destino         INT,
  FOREIGN KEY (id_destino) REFERENCES destino(id_destino)
) ENGINE=InnoDB;

CREATE TABLE guia_idioma (
  id_guia    INT NOT NULL,
  id_idioma  INT NOT NULL,
  PRIMARY KEY (id_guia, id_idioma),
  FOREIGN KEY (id_guia)   REFERENCES guia(id_guia),
  FOREIGN KEY (id_idioma) REFERENCES idioma(id_idioma)
) ENGINE=InnoDB;

CREATE TABLE hospedagem (
  id_hospedagem   INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  endereco        VARCHAR(150),
  preco_diaria    DECIMAL(10,2) NOT NULL,
  avaliacao       DECIMAL(3,2) DEFAULT 0,
  qtd_avaliacoes  INT DEFAULT 0,
  id_destino      INT NOT NULL,
  FOREIGN KEY (id_destino) REFERENCES destino(id_destino)
) ENGINE=InnoDB;

CREATE TABLE pacote (
  id_pacote     INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  tipo          VARCHAR(50),
  descricao     TEXT,
  duracao_dias  INT NOT NULL,
  preco         DECIMAL(10,2) NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,      -- só pacotes ativos aparecem (RF-03.1)
  emoji         VARCHAR(10),
  cor_fundo     VARCHAR(10),
  id_destino    INT NOT NULL,
  FOREIGN KEY (id_destino) REFERENCES destino(id_destino)
) ENGINE=InnoDB;

CREATE TABLE roteiro_pacote (
  id_roteiro  INT AUTO_INCREMENT PRIMARY KEY,
  id_pacote   INT NOT NULL,
  dia         INT NOT NULL,
  descricao   VARCHAR(200) NOT NULL,
  FOREIGN KEY (id_pacote) REFERENCES pacote(id_pacote)
) ENGINE=InnoDB;

CREATE TABLE passagem (
  id_passagem   INT AUTO_INCREMENT PRIMARY KEY,
  origem        VARCHAR(100) NOT NULL,
  destino_voo   VARCHAR(100) NOT NULL,
  data_voo      DATE NOT NULL,
  preco         DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE reserva (
  id_reserva      INT AUTO_INCREMENT PRIMARY KEY,
  codigo_voucher  VARCHAR(20) NOT NULL UNIQUE,
  data_reserva    DATE NOT NULL,
  data_hora_reserva DATETIME NULL,
  data_ida        DATE NOT NULL,
  valor_total     DECIMAL(10,2) NOT NULL,
  valor_pacote_original DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_desconto  DECIMAL(10,2) NOT NULL DEFAULT 0,
  status_reserva  VARCHAR(50) NOT NULL DEFAULT 'Pendente',  -- Pendente, Confirmada, Cancelada
  id_usuario      INT NOT NULL,
  id_pacote       INT NULL,                          -- Permite hospedagem avulsa sem pacote associado
  id_guia         INT,
  id_hospedagem   INT,
  id_passagem     INT,
  FOREIGN KEY (id_usuario)    REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_pacote)     REFERENCES pacote(id_pacote),
  FOREIGN KEY (id_guia)       REFERENCES guia(id_guia),
  FOREIGN KEY (id_hospedagem) REFERENCES hospedagem(id_hospedagem),
  FOREIGN KEY (id_passagem)   REFERENCES passagem(id_passagem),
  INDEX idx_reserva_usuario_data (id_usuario, data_reserva),
  INDEX idx_reserva_status_data (status_reserva, data_reserva),
  INDEX idx_reserva_guia (id_guia)
) ENGINE=InnoDB;

CREATE TABLE acesso_site (
  id_acesso    BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario   INT NULL,
  metodo       VARCHAR(10) NOT NULL,
  caminho      VARCHAR(255) NOT NULL,
  status_http  SMALLINT UNSIGNED NOT NULL,
  acessado_em  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  INDEX idx_acesso_data (acessado_em),
  INDEX idx_acesso_usuario_data (id_usuario, acessado_em),
  INDEX idx_acesso_caminho_data (caminho(100), acessado_em)
) ENGINE=InnoDB;

CREATE TABLE historico_reserva (
  id_historico      BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_reserva        INT NOT NULL,
  id_usuario_admin  INT NOT NULL,
  acao              VARCHAR(50) NOT NULL,
  detalhes          TEXT NOT NULL,
  criado_em         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva),
  FOREIGN KEY (id_usuario_admin) REFERENCES usuario(id_usuario),
  INDEX idx_historico_reserva_data (id_reserva, criado_em)
) ENGINE=InnoDB;

CREATE TABLE email_outbox (
  id_email         BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_reserva       INT NULL,
  id_guia          INT NULL,
  destinatario     VARCHAR(254) NULL,
  assunto          VARCHAR(255) NOT NULL,
  conteudo_texto   MEDIUMTEXT NOT NULL,
  status           ENUM('pendente','enviando','enviado','falhou') NOT NULL DEFAULT 'pendente',
  tentativas       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ultimo_erro      TEXT,
  criado_em        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  enviado_em       DATETIME NULL,
  FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva) ON DELETE SET NULL,
  FOREIGN KEY (id_guia) REFERENCES guia(id_guia) ON DELETE SET NULL,
  INDEX idx_email_fila (status, criado_em),
  INDEX idx_email_reserva (id_reserva),
  INDEX idx_email_guia (id_guia)
) ENGINE=InnoDB;

CREATE TABLE pagamento (
  id_pagamento     INT AUTO_INCREMENT PRIMARY KEY,
  forma_pagamento  VARCHAR(50) NOT NULL,
  valor            DECIMAL(10,2) NOT NULL,
  data_pagamento   DATE NOT NULL,
  status_pagamento VARCHAR(30) NOT NULL DEFAULT 'Aprovado',
  id_reserva       INT NOT NULL,
  FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
) ENGINE=InnoDB;

-- Cada avaliação é de um guia OU de uma hospedagem (o outro campo fica NULL)
CREATE TABLE avaliacao (
  id_avaliacao    INT AUTO_INCREMENT PRIMARY KEY,
  nota            INT NOT NULL,
  comentario      TEXT,
  data_avaliacao  DATE NOT NULL,
  id_usuario      INT NOT NULL,
  id_guia         INT,
  id_hospedagem   INT,
  FOREIGN KEY (id_usuario)    REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_guia)       REFERENCES guia(id_guia),
  FOREIGN KEY (id_hospedagem) REFERENCES hospedagem(id_hospedagem)
) ENGINE=InnoDB;

CREATE TABLE notificacao (
  id_notificacao      INT AUTO_INCREMENT PRIMARY KEY,
  mensagem            TEXT NOT NULL,
  data_envio          DATE NOT NULL,
  status_notificacao  VARCHAR(30) NOT NULL DEFAULT 'Enviada',
  id_usuario          INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE mensagem_guia (
  id_mensagem  INT AUTO_INCREMENT PRIMARY KEY,
  conteudo     TEXT NOT NULL,
  data_envio   DATETIME NOT NULL,
  id_usuario   INT NOT NULL,
  id_guia      INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_guia)    REFERENCES guia(id_guia)
) ENGINE=InnoDB;

CREATE TABLE contato (
  id_contato  INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  assunto     TEXT NOT NULL,
  data_envio  DATETIME NOT NULL,
  respondido  BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. DADOS DE EXEMPLO
-- ---------------------------------------------------------------------

INSERT INTO destino (cidade, estado, pais, descricao) VALUES
('Bonito',              'MS',        'Brasil',    'Destino de ecoturismo famoso pelas águas cristalinas, grutas e flutuação em rios.'),
('Bariloche',           'Río Negro', 'Argentina', 'Patagônia argentina com lagos cristalinos e montanhas nevadas.'),
('Lisboa',              'Lisboa',    'Portugal',  'Capital histórica com ladeiras, bondes amarelos e a Torre de Belém.'),
('Barreirinhas',        'MA',        'Brasil',    'Porta de entrada dos Lençóis Maranhenses, com dunas brancas e lagoas de água doce.'),
('Rio de Janeiro',      'RJ',        'Brasil',    'Cristo Redentor, Pão de Açúcar e praias famosas.'),
('Foz do Iguaçu',       'PR',        'Brasil',    'Lar das Cataratas do Iguaçu e do Parque das Aves.'),
('Bombinhas',           'SC',        'Brasil',    'Praias de águas claras e mergulho no litoral catarinense.'),
('Porto de Galinhas',   'PE',        'Brasil',    'Piscinas naturais e praias de águas mornas em Pernambuco.'),
('Florianópolis',       'SC',        'Brasil',    'Ilha com dezenas de praias, trilhas e boa gastronomia.');

-- Senhas de teste: clientes = Senha@123 | admin = Admin@1234
-- Os hashes SHA-256 de demonstração migram para scrypt após o primeiro login.
INSERT INTO usuario (nome, email, telefone, senha, tipo, bloqueado, data_cadastro) VALUES
('Administrador GuiaJa', 'admin@guiaja.com',  '(14) 99999-0001', SHA2('Admin@1234',256), 'admin',   FALSE, '2026-09-01'),
('Ana Souza',            'ana@email.com',     '(14) 99888-1111', SHA2('Senha@123',256),  'cliente', FALSE, '2026-10-05'),
('Bruno Lima',           'bruno@email.com',   '(14) 99777-2222', SHA2('Senha@123',256),  'cliente', FALSE, '2026-10-12'),
('Carla Dias',           'carla@email.com',   '(18) 99666-3333', SHA2('Senha@123',256),  'cliente', FALSE, '2026-10-20'),
('Diego Rocha',          'diego@email.com',   '(11) 99555-4444', SHA2('Senha@123',256),  'cliente', FALSE, '2026-10-28'),
('Elisa Prado',          'elisa@email.com',   '(14) 99444-5555', SHA2('Senha@123',256),  'cliente', FALSE, '2026-11-01');

INSERT INTO idioma (nome) VALUES ('Português'), ('Inglês'), ('Italiano'), ('Francês');

INSERT INTO guia (nome, email, telefone, especialidade, curriculo, valor_hora, anos_experiencia, avaliacao, qtd_avaliacoes, tag_status, status_aprovacao, id_destino) VALUES
('João Silva',     'joao@guiaja.com',   '(67) 99111-0001', 'Trilhas e ecoturismo', 'Guia credenciado em ecoturismo, 10 anos de experiência em Bonito.',  120.00, 10, 4.80, 1220, 'Mais escolhido',   'aprovado',  1),
('Marco Rossi',    'marco@guiaja.com',  '(21) 99111-0002', 'História e cultura',   'Historiador e guia de turismo cultural, atende em italiano e português.', 90.00, 8, 4.70,  920, 'Disponível agora', 'aprovado',  3),
('Sophia Miller',  'sophia@guiaja.com', '(21) 99111-0003', 'Cidade e gastronomia', 'Guia bilíngue com foco em roteiros urbanos e gastronomia local.',        70.00, 7, 4.60,  623, 'Disponível agora', 'aprovado',  5),
('Antoine Girard', 'antoine@guiaja.com','(45) 99111-0004', 'Natureza e aventura',  'Guia de parques naturais, atende em francês.',                            66.00, 5, 4.50,  526, 'Disponível agora', 'aprovado',  6),
('Carla Mendes',   'carlam@email.com',  '(98) 99111-0005', 'Passeios de dunas',    'Guia local em Barreirinhas há 4 anos. Aguardando análise.',               NULL,  4, 0,        0, NULL,               'pendente',  4),
('Pedro Alves',    'pedro@email.com',   '(48) 99111-0006', 'Trilhas',              'Condutor de trilhas em Florianópolis. Aguardando análise.',               NULL,  3, 0,        0, NULL,               'pendente',  9);

-- Distribui aleatoriamente os guias de demonstração entre destinos cadastrados.
CREATE TEMPORARY TABLE guia_destinos_sorteados (
  ordem INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_destino INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO guia_destinos_sorteados (id_destino)
SELECT id_destino FROM destino ORDER BY RAND();

CREATE TEMPORARY TABLE guias_sorteados (
  ordem INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_guia INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO guias_sorteados (id_guia)
SELECT id_guia FROM guia ORDER BY RAND();

UPDATE guia g
JOIN guias_sorteados gs ON gs.id_guia = g.id_guia
JOIN guia_destinos_sorteados ds ON ds.ordem = gs.ordem
SET g.id_destino = ds.id_destino;

DROP TEMPORARY TABLE guias_sorteados;
DROP TEMPORARY TABLE guia_destinos_sorteados;

INSERT INTO guia_idioma (id_guia, id_idioma) VALUES
(1,1),(1,2),   -- João: Português, Inglês
(2,3),(2,1),   -- Marco: Italiano, Português
(3,2),         -- Sophia: Inglês
(4,4),         -- Antoine: Francês
(5,1),(6,1),(6,2);

INSERT INTO hospedagem (nome, endereco, preco_diaria, avaliacao, qtd_avaliacoes, id_destino) VALUES
('Hotel Monumental', 'Av. Principal, 1500 - Bombinhas, SC',            220.00, 5.00, 1220, 7),
('Hotel Paraíso',    'Av. Atlântica, 800 - Rio de Janeiro, RJ',        200.00, 4.60,  950, 5),
('Hotel Beira Mar',  'Rua do Mar, 300 - Porto de Galinhas, PE',        190.00, 4.80, 1100, 8),
('Hotel Horizonte',  'Av. das Palmeiras, 90 - Florianópolis, SC',      180.00, 4.90, 1210, 9);

INSERT INTO pacote (nome, tipo, descricao, duracao_dias, preco, ativo, emoji, cor_fundo, id_destino) VALUES
('Bonito, MS',               'Ecoturismo',        'Águas cristalinas, grutas e flutuação em rios.',                  3, 1990.00, TRUE,  '🌿', '#bfe8df', 1),
('Bariloche, ARG',           'Neve e montanhas',  'Lagos cristalinos e montanhas nevadas na Patagônia.',             5, 2999.00, TRUE,  '🏔️', '#cfe3f7', 2),
('Lisboa, POR',              'Cultura',           'Capital histórica com ladeiras, bondes e a Torre de Belém.',      4, 2100.00, TRUE,  '🏰', '#f9dfc4', 3),
('Lençóis Maranhenses, MA',  'Natureza',          'Dunas brancas com lagoas de água doce.',                          4, 2450.00, TRUE,  '🏜️', '#f6ecc8', 4),
('Rio de Janeiro, RJ',       'Praia e cidade',    'Cristo Redentor, Pão de Açúcar e praias famosas.',                3, 1799.99, TRUE,  '🏖️', '#fbd9d3', 5),
('Foz do Iguaçu, PR',        'Natureza',          'As Cataratas do Iguaçu e o Parque das Aves.',                     3, 1580.00, TRUE,  '💦', '#d6efd0', 6);

INSERT INTO roteiro_pacote (id_pacote, dia, descricao) VALUES
(1,1,'Chegada à cidade e check-in no hotel'),
(1,2,'Visita à Gruta do Lago Azul e almoço local'),
(1,3,'Flutuação no Rio Sucuri e encerramento'),
(2,1,'Chegada e passeio pelo centro'),
(2,2,'Circuito Chico'),
(2,3,'Cerro Catedral'),
(2,4,'Lago Nahuel Huapi'),
(2,5,'Retorno'),
(3,1,'Chegada e Alfama'),
(3,2,'Torre de Belém e Mosteiro'),
(3,3,'Sintra'),
(3,4,'Retorno'),
(4,1,'Chegada a Barreirinhas'),
(4,2,'Passeio pelas lagoas'),
(4,3,'Rio Preguiças'),
(4,4,'Retorno'),
(5,1,'Chegada e Copacabana'),
(5,2,'Cristo Redentor e Pão de Açúcar'),
(5,3,'Retorno'),
(6,1,'Chegada e check-in'),
(6,2,'Cataratas do lado brasileiro'),
(6,3,'Parque das Aves e retorno');

INSERT INTO passagem (origem, destino_voo, data_voo, preco) VALUES
('São Paulo (GRU)', 'Bonito (via Campo Grande - CGR)', DATE_ADD(CURDATE(), INTERVAL 30 DAY),  650.00),
('São Paulo (GRU)', 'Bariloche (BRC)',                DATE_ADD(CURDATE(), INTERVAL 31 DAY), 2100.00),
('São Paulo (GRU)', 'Lisboa (LIS)',                   DATE_ADD(CURDATE(), INTERVAL 32 DAY), 3200.00),
('São Paulo (GRU)', 'Barreirinhas (via São Luís - SLZ)', DATE_ADD(CURDATE(), INTERVAL 33 DAY), 720.00),
('São Paulo (GRU)', 'Rio de Janeiro (SDU)',            DATE_ADD(CURDATE(), INTERVAL 34 DAY),  550.00),
('São Paulo (GRU)', 'Foz do Iguaçu (IGU)',             DATE_ADD(CURDATE(), INTERVAL 35 DAY),  480.00),
('São Paulo (GRU)', 'Bombinhas (via Navegantes - NVT)', DATE_ADD(CURDATE(), INTERVAL 36 DAY), 690.00),
('São Paulo (GRU)', 'Porto de Galinhas (via Recife - REC)', DATE_ADD(CURDATE(), INTERVAL 37 DAY), 780.00),
('São Paulo (GRU)', 'Florianópolis (FLN)',             DATE_ADD(CURDATE(), INTERVAL 38 DAY),  490.00);

-- Total = preço do pacote + diária x dias + valor/hora do guia x 4h x dias
INSERT INTO reserva (codigo_voucher, data_reserva, data_ida, valor_total, status_reserva, id_usuario, id_pacote, id_guia, id_hospedagem, id_passagem) VALUES
('GJ-A1B2C3', '2026-11-02', '2026-12-10', 3970.00, 'Confirmada', 2, 1, 1, 4, 1),
('GJ-D4E5F6', '2026-11-05', '2026-12-18', 4340.00, 'Confirmada', 3, 3, 2, 2, 2),
('GJ-G7H8I9', '2026-11-10', '2026-12-20', 3032.00, 'Pendente',   4, 6, 4, 1, NULL),
('GJ-J1K2L3', '2026-11-08', '2026-12-05', 3239.99, 'Cancelada',  5, 5, 3, 2, NULL),
('GJ-M4N5O6', '2026-11-12', '2027-01-08', 5349.00, 'Confirmada', 6, 2, 3, 3, 3);

INSERT INTO pagamento (forma_pagamento, valor, data_pagamento, status_pagamento, id_reserva) VALUES
('Cartão de crédito', 3970.00, '2026-11-02', 'Aprovado',  1),
('Pix',               4340.00, '2026-11-05', 'Aprovado',  2),
('Cartão de crédito', 3239.99, '2026-11-08', 'Estornado', 4),
('Cartão de crédito', 5349.00, '2026-11-12', 'Aprovado',  5);

INSERT INTO avaliacao (nota, comentario, data_avaliacao, id_usuario, id_guia, id_hospedagem) VALUES
(5, 'João conhece cada trilha de Bonito. Passeio perfeito!',     '2026-11-14', 2, 1,    NULL),
(5, 'Marco tornou Lisboa ainda mais especial, muito atencioso.', '2026-11-15', 3, 2,    NULL),
(4, 'Sophia foi simpática e pontual.',                           '2026-11-15', 6, 3,    NULL),
(5, 'Hotel confortável, ótimo café da manhã.',                   '2026-11-14', 2, NULL, 4),
(4, 'Boa localização, quarto simples.',                          '2026-11-15', 3, NULL, 2);

INSERT INTO notificacao (mensagem, data_envio, status_notificacao, id_usuario) VALUES
('Sua reserva GJ-A1B2C3 (Bonito, MS) foi confirmada. Seu voucher já está disponível.',   '2026-11-02', 'Lida',     2),
('Sua reserva GJ-D4E5F6 (Lisboa, POR) foi confirmada. Boa viagem!',                      '2026-11-05', 'Lida',     3),
('Sua reserva GJ-G7H8I9 aguarda a confirmação do pagamento.',                            '2026-11-10', 'Enviada',  4),
('Sua reserva GJ-J1K2L3 foi cancelada e o valor será estornado.',                        '2026-11-09', 'Enviada',  5),
('Sua reserva GJ-M4N5O6 (Bariloche, ARG) foi confirmada. Boa viagem!',                   '2026-11-12', 'Enviada',  6);

INSERT INTO mensagem_guia (conteudo, data_envio, id_usuario, id_guia) VALUES
('Olá João! Você teria disponibilidade para a Gruta do Lago Azul em 11/12?', '2026-11-01 10:30:00', 2, 1),
('Boa tarde Marco, é possível um roteiro com foco em história de Lisboa?',   '2026-11-04 15:10:00', 3, 2);

INSERT INTO contato (nome, email, assunto, data_envio, respondido) VALUES
('Fernanda Costa', 'fernanda@email.com', 'Vocês têm pacotes para o Nordeste no feriado?',     '2026-11-11 09:00:00', FALSE),
('Ricardo Nunes',  'ricardo@email.com',  'Como faço para cancelar uma reserva?',               '2026-11-12 14:20:00', TRUE),
('Paula Martins',  'paula@email.com',    'Quero saber mais sobre os guias que falam inglês.',  '2026-11-13 18:45:00', FALSE);

-- ---------------------------------------------------------------------
-- 3. VIEWS (consultas prontas que o sistema vai usar)
-- ---------------------------------------------------------------------

CREATE VIEW vw_pacotes_ativos AS
SELECT p.id_pacote, p.nome, p.tipo, p.descricao, p.duracao_dias, p.preco, p.emoji, p.cor_fundo,
       d.cidade, d.pais
FROM pacote p JOIN destino d ON d.id_destino = p.id_destino
WHERE p.ativo = TRUE;

CREATE VIEW vw_reservas_detalhadas AS
SELECT r.codigo_voucher, r.data_reserva, r.data_ida, r.valor_total, r.status_reserva,
       u.nome AS cliente, p.nome AS pacote, g.nome AS guia, h.nome AS hospedagem
FROM reserva r
JOIN usuario u ON u.id_usuario = r.id_usuario
LEFT JOIN pacote p ON p.id_pacote = r.id_pacote
LEFT JOIN guia g ON g.id_guia = r.id_guia
LEFT JOIN hospedagem h ON h.id_hospedagem = r.id_hospedagem;

-- Relatório do administrador: pacotes mais procurados
CREATE VIEW vw_pacotes_mais_reservados AS
SELECT p.nome AS pacote, COUNT(r.id_reserva) AS total_reservas, SUM(r.valor_total) AS valor_total
FROM pacote p LEFT JOIN reserva r ON r.id_pacote = p.id_pacote AND r.status_reserva <> 'Cancelada'
GROUP BY p.id_pacote, p.nome
ORDER BY total_reservas DESC;

CREATE VIEW vw_compras_por_mes AS
SELECT DATE_FORMAT(data_reserva, '%Y-%m') AS mes,
       COUNT(*) AS total_compras,
       SUM(status_reserva = 'Confirmada') AS confirmadas,
       SUM(status_reserva = 'Cancelada') AS canceladas,
       SUM(CASE WHEN status_reserva = 'Confirmada' THEN valor_total ELSE 0 END) AS faturamento
FROM reserva
GROUP BY DATE_FORMAT(data_reserva, '%Y-%m')
ORDER BY mes DESC;

CREATE VIEW vw_acessos_por_dia AS
SELECT DATE(acessado_em) AS dia, COUNT(*) AS total_acessos,
       COUNT(DISTINCT id_usuario) AS usuarios_identificados
FROM acesso_site
GROUP BY DATE(acessado_em)
ORDER BY dia DESC;

-- ---------------------------------------------------------------------
-- 4. TESTES RÁPIDOS (selecione e execute para ver se deu certo)
-- ---------------------------------------------------------------------
-- SELECT * FROM vw_pacotes_ativos;
-- SELECT * FROM vw_reservas_detalhadas;
-- SELECT * FROM vw_pacotes_mais_reservados;
-- SELECT * FROM vw_compras_por_mes;
-- SELECT * FROM vw_acessos_por_dia;
-- SELECT g.nome, GROUP_CONCAT(i.nome) AS idiomas FROM guia g
--   JOIN guia_idioma gi ON gi.id_guia = g.id_guia JOIN idioma i ON i.id_idioma = gi.id_idioma
--   WHERE g.status_aprovacao = 'aprovado' GROUP BY g.id_guia;
-- Login de teste:
-- SELECT id_usuario, nome FROM usuario WHERE email = 'ana@email.com' AND senha = SHA2('Senha@123',256);
