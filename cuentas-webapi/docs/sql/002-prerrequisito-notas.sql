-- Prerrequisito manual (GPS, DDL de referencia) — la API NO provisiona la BD.
-- Slice 1.2: la tabla `notas` (CHECK tipo/monto + FK cuenta_id, GPS D8).
-- Credenciales: siempre vía env (MSSQL_USER/MSSQL_PASS/MSSQL_DATABASE) — nunca aquí.
-- Pensado para sqlcmd (usar GO como separador de lotes; el driver mssql NO lo soporta).

USE cuentas_webapi;
GO

IF OBJECT_ID('dbo.notas', 'U') IS NULL
    CREATE TABLE notas (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        cuenta_id   INT NOT NULL REFERENCES cuentas(id),
        tipo        NVARCHAR(10) NOT NULL CONSTRAINT chk_nota_tipo CHECK (tipo IN ('debito','credito')),
        monto       DECIMAL(18,2) NOT NULL CONSTRAINT chk_nota_monto CHECK (monto > 0),
        descripcion NVARCHAR(200) NOT NULL,
        estado      BIT NOT NULL DEFAULT(1)
    );
GO
