USE guiaja;

ALTER TABLE reserva
  ADD COLUMN data_hora_reserva DATETIME NULL AFTER data_reserva;
