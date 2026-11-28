USE guiaja;

CREATE OR REPLACE VIEW vw_pacotes_ativos AS
SELECT p.id_pacote, p.nome, p.tipo, p.descricao, p.duracao_dias, p.preco, p.emoji, p.cor_fundo,
       d.cidade, d.pais
FROM pacote p
JOIN destino d ON d.id_destino = p.id_destino
WHERE p.ativo = TRUE;

CREATE OR REPLACE VIEW vw_reservas_detalhadas AS
SELECT r.codigo_voucher, r.data_reserva, r.data_ida, r.valor_total, r.status_reserva,
       u.nome AS cliente, p.nome AS pacote, g.nome AS guia, h.nome AS hospedagem
FROM reserva r
JOIN usuario u ON u.id_usuario = r.id_usuario
LEFT JOIN pacote p ON p.id_pacote = r.id_pacote
LEFT JOIN guia g ON g.id_guia = r.id_guia
LEFT JOIN hospedagem h ON h.id_hospedagem = r.id_hospedagem;

CREATE OR REPLACE VIEW vw_pacotes_mais_reservados AS
SELECT p.nome AS pacote, COUNT(r.id_reserva) AS total_reservas, SUM(r.valor_total) AS valor_total
FROM pacote p
LEFT JOIN reserva r ON r.id_pacote = p.id_pacote AND r.status_reserva <> 'Cancelada'
GROUP BY p.id_pacote, p.nome
ORDER BY total_reservas DESC;

CREATE OR REPLACE VIEW vw_compras_por_mes AS
SELECT DATE_FORMAT(data_reserva, '%Y-%m') AS mes,
       COUNT(*) AS total_compras,
       SUM(status_reserva = 'Confirmada') AS confirmadas,
       SUM(status_reserva = 'Cancelada') AS canceladas,
       SUM(CASE WHEN status_reserva = 'Confirmada' THEN valor_total ELSE 0 END) AS faturamento
FROM reserva
GROUP BY DATE_FORMAT(data_reserva, '%Y-%m')
ORDER BY mes DESC;

CREATE OR REPLACE VIEW vw_acessos_por_dia AS
SELECT DATE(acessado_em) AS dia,
       COUNT(*) AS total_acessos,
       COUNT(DISTINCT id_usuario) AS usuarios_identificados
FROM acesso_site
GROUP BY DATE(acessado_em)
ORDER BY dia DESC;
