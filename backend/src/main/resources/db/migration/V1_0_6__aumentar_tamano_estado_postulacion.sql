-- Aumentar el tamaño de la columna estado en la tabla postulaciones
ALTER TABLE postulaciones MODIFY COLUMN estado VARCHAR(30) NOT NULL; 