-- Añadir la columna requiere_prueba a la tabla vacantes
ALTER TABLE vacantes ADD COLUMN requiere_prueba BOOLEAN DEFAULT FALSE;

-- Actualizar las vacantes existentes que tienen pruebas técnicas asociadas
UPDATE vacantes v
SET v.requiere_prueba = TRUE
WHERE EXISTS (
    SELECT 1 FROM pruebas_tecnicas pt
    WHERE pt.vacante_id = v.id
); 