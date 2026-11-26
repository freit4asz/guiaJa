-- Fila durável de notificações de compras e candidaturas.
-- Execute no banco guiaja; não remove nem altera registros existentes.
USE guiaja;

CREATE TABLE IF NOT EXISTS email_outbox (
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
