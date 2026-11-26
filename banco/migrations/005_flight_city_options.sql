USE guiaja;

INSERT INTO passagem (origem, destino_voo, data_voo, preco)
SELECT flight.origin, flight.destination,
       DATE_ADD(CURDATE(), INTERVAL flight.days DAY), flight.price
FROM (
  SELECT 'São Paulo (GRU)' AS origin, 'Bonito (via Campo Grande - CGR)' AS destination, 30 AS days, 650.00 AS price
  UNION ALL SELECT 'São Paulo (GRU)', 'Bariloche (BRC)', 31, 2100.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Lisboa (LIS)', 32, 3200.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Barreirinhas (via São Luís - SLZ)', 33, 720.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Rio de Janeiro (SDU)', 34, 550.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Foz do Iguaçu (IGU)', 35, 480.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Bombinhas (via Navegantes - NVT)', 36, 690.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Porto de Galinhas (via Recife - REC)', 37, 780.00
  UNION ALL SELECT 'São Paulo (GRU)', 'Florianópolis (FLN)', 38, 490.00
) AS flight
WHERE NOT EXISTS (
  SELECT 1
  FROM passagem existing
  WHERE existing.origem = flight.origin
    AND existing.destino_voo = flight.destination
    AND existing.data_voo >= CURDATE()
);
