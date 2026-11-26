USE guiaja;

ALTER TABLE reserva
  ADD COLUMN valor_pacote_original DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER valor_total,
  ADD COLUMN valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER valor_pacote_original;
