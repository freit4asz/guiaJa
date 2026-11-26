-- Migração incremental para bancos GuiaJa já existentes.
-- Execute uma única vez no banco guiaja. Não remove nem altera dados atuais.
USE guiaja;

SET @index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reserva' AND index_name = 'idx_reserva_usuario_data'
);
SET @index_sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_reserva_usuario_data ON reserva (id_usuario, data_reserva)',
  'SELECT 1'
);
PREPARE index_statement FROM @index_sql;
EXECUTE index_statement;
DEALLOCATE PREPARE index_statement;

SET @index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reserva' AND index_name = 'idx_reserva_status_data'
);
SET @index_sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_reserva_status_data ON reserva (status_reserva, data_reserva)',
  'SELECT 1'
);
PREPARE index_statement FROM @index_sql;
EXECUTE index_statement;
DEALLOCATE PREPARE index_statement;

SET @index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reserva' AND index_name = 'idx_reserva_guia'
);
SET @index_sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_reserva_guia ON reserva (id_guia)',
  'SELECT 1'
);
PREPARE index_statement FROM @index_sql;
EXECUTE index_statement;
DEALLOCATE PREPARE index_statement;

CREATE TABLE IF NOT EXISTS acesso_site (
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

CREATE TABLE IF NOT EXISTS historico_reserva (
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
SELECT DATE(acessado_em) AS dia, COUNT(*) AS total_acessos,
       COUNT(DISTINCT id_usuario) AS usuarios_identificados
FROM acesso_site
GROUP BY DATE(acessado_em)
ORDER BY dia DESC;
