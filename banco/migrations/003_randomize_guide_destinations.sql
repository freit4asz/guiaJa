-- Sorteia uma cidade cadastrada diferente para cada guia já existente.
-- Execute uma única vez: a associação sorteada fica persistida no guia.
USE guiaja;

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
