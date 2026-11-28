USE guiaja;

START TRANSACTION;

INSERT INTO hospedagem (nome, endereco, preco_diaria, avaliacao, qtd_avaliacoes, id_destino)
SELECT seed.nome, seed.endereco, seed.preco_diaria, seed.avaliacao, seed.qtd_avaliacoes, d.id_destino
FROM (
  SELECT 'Hotel Monumental' AS nome, 'Av. Principal, 1500 - Bombinhas, SC' AS endereco, 220.00 AS preco_diaria, 5.00 AS avaliacao, 1220 AS qtd_avaliacoes, 'Bombinhas' AS cidade, 'Brasil' AS pais
  UNION ALL SELECT 'Hotel Paraíso', 'Av. Atlântica, 800 - Rio de Janeiro, RJ', 200.00, 4.60, 950, 'Rio de Janeiro', 'Brasil'
  UNION ALL SELECT 'Hotel Beira Mar', 'Rua do Mar, 300 - Porto de Galinhas, PE', 190.00, 4.80, 1100, 'Porto de Galinhas', 'Brasil'
  UNION ALL SELECT 'Hotel Horizonte', 'Av. das Palmeiras, 90 - Florianópolis, SC', 180.00, 4.90, 1210, 'Florianópolis', 'Brasil'
) AS seed
JOIN destino d ON d.cidade = seed.cidade AND d.pais = seed.pais
WHERE NOT EXISTS (
  SELECT 1 FROM hospedagem h WHERE h.nome = seed.nome
);

INSERT INTO pacote (nome, tipo, descricao, duracao_dias, preco, ativo, emoji, cor_fundo, id_destino)
SELECT seed.nome, seed.tipo, seed.descricao, seed.duracao_dias, seed.preco, TRUE, seed.emoji, seed.cor_fundo, d.id_destino
FROM (
  SELECT 'Bonito, MS' AS nome, 'Ecoturismo' AS tipo, 'Águas cristalinas, grutas e flutuação em rios.' AS descricao, 3 AS duracao_dias, 1990.00 AS preco, '🌿' AS emoji, '#bfe8df' AS cor_fundo, 'Bonito' AS cidade, 'Brasil' AS pais
  UNION ALL SELECT 'Bariloche, ARG', 'Neve e montanhas', 'Lagos cristalinos e montanhas nevadas na Patagônia.', 5, 2999.00, '🏔️', '#cfe3f7', 'Bariloche', 'Argentina'
  UNION ALL SELECT 'Lisboa, POR', 'Cultura', 'Capital histórica com ladeiras, bondes e a Torre de Belém.', 4, 2100.00, '🏰', '#f9dfc4', 'Lisboa', 'Portugal'
  UNION ALL SELECT 'Lençóis Maranhenses, MA', 'Natureza', 'Dunas brancas com lagoas de água doce.', 4, 2450.00, '🏜️', '#f6ecc8', 'Barreirinhas', 'Brasil'
  UNION ALL SELECT 'Rio de Janeiro, RJ', 'Praia e cidade', 'Cristo Redentor, Pão de Açúcar e praias famosas.', 3, 1799.99, '🏖️', '#fbd9d3', 'Rio de Janeiro', 'Brasil'
  UNION ALL SELECT 'Foz do Iguaçu, PR', 'Natureza', 'As Cataratas do Iguaçu e o Parque das Aves.', 3, 1580.00, '💦', '#d6efd0', 'Foz do Iguaçu', 'Brasil'
) AS seed
JOIN destino d ON d.cidade = seed.cidade AND d.pais = seed.pais
WHERE NOT EXISTS (
  SELECT 1 FROM pacote p WHERE p.nome = seed.nome
);

INSERT INTO roteiro_pacote (id_pacote, dia, descricao)
SELECT p.id_pacote, seed.dia, seed.descricao
FROM (
  SELECT 'Bonito, MS' AS pacote, 1 AS dia, 'Chegada à cidade e check-in no hotel' AS descricao
  UNION ALL SELECT 'Bonito, MS', 2, 'Visita à Gruta do Lago Azul e almoço local'
  UNION ALL SELECT 'Bonito, MS', 3, 'Flutuação no Rio Sucuri e encerramento'
  UNION ALL SELECT 'Bariloche, ARG', 1, 'Chegada e passeio pelo centro'
  UNION ALL SELECT 'Bariloche, ARG', 2, 'Circuito Chico'
  UNION ALL SELECT 'Bariloche, ARG', 3, 'Cerro Catedral'
  UNION ALL SELECT 'Bariloche, ARG', 4, 'Lago Nahuel Huapi'
  UNION ALL SELECT 'Bariloche, ARG', 5, 'Retorno'
  UNION ALL SELECT 'Lisboa, POR', 1, 'Chegada e Alfama'
  UNION ALL SELECT 'Lisboa, POR', 2, 'Torre de Belém e Mosteiro'
  UNION ALL SELECT 'Lisboa, POR', 3, 'Sintra'
  UNION ALL SELECT 'Lisboa, POR', 4, 'Retorno'
  UNION ALL SELECT 'Lençóis Maranhenses, MA', 1, 'Chegada a Barreirinhas'
  UNION ALL SELECT 'Lençóis Maranhenses, MA', 2, 'Passeio pelas lagoas'
  UNION ALL SELECT 'Lençóis Maranhenses, MA', 3, 'Rio Preguiças'
  UNION ALL SELECT 'Lençóis Maranhenses, MA', 4, 'Retorno'
  UNION ALL SELECT 'Rio de Janeiro, RJ', 1, 'Chegada e Copacabana'
  UNION ALL SELECT 'Rio de Janeiro, RJ', 2, 'Cristo Redentor e Pão de Açúcar'
  UNION ALL SELECT 'Rio de Janeiro, RJ', 3, 'Retorno'
  UNION ALL SELECT 'Foz do Iguaçu, PR', 1, 'Chegada e check-in'
  UNION ALL SELECT 'Foz do Iguaçu, PR', 2, 'Cataratas do lado brasileiro'
  UNION ALL SELECT 'Foz do Iguaçu, PR', 3, 'Parque das Aves e retorno'
) AS seed
JOIN pacote p ON p.nome = seed.pacote
WHERE NOT EXISTS (
  SELECT 1
  FROM roteiro_pacote r
  WHERE r.id_pacote = p.id_pacote AND r.dia = seed.dia
);

INSERT INTO passagem (origem, destino_voo, data_voo, preco)
SELECT seed.origem, seed.destino_voo, DATE_ADD(CURDATE(), INTERVAL seed.dias DAY), seed.preco
FROM (
  SELECT 'São Paulo (GRU)' AS origem, 'Bonito (via Campo Grande - CGR)' AS destino_voo, 30 AS dias, 650.00 AS preco
  UNION ALL SELECT 'São Paulo (GRU)', 'Bariloche (BRC)', 31, 2100.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Lisboa (LIS)', 32, 3200.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Barreirinhas (via São Luís - SLZ)', 33, 720.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Rio de Janeiro (SDU)', 34, 550.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Foz do Iguaçu (IGU)', 35, 480.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Bombinhas (via Navegantes - NVT)', 36, 690.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Porto de Galinhas (via Recife - REC)', 37, 780.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Florianópolis (FLN)', 38, 490.00
) AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM passagem f
  WHERE f.origem = seed.origem AND f.destino_voo = seed.destino_voo
);

COMMIT;
