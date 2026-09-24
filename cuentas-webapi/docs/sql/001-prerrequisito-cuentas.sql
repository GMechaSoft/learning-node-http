-- Prerrequisito manual (GPS, DDL de referencia) — la API NO provisiona la BD.
-- Slice 1.1: solo la tabla `cuentas`. La tabla `notas` llegará con la HU 1.2.
-- Credenciales: siempre vía env (MSSQL_USER/MSSQL_PASS/MSSQL_DATABASE) — nunca aquí.

IF DB_ID('cuentas_webapi') IS NULL
    CREATE DATABASE cuentas_webapi;
GO

USE cuentas_webapi;
GO

IF OBJECT_ID('dbo.cuentas', 'U') IS NULL
    CREATE TABLE cuentas (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        descripcion NVARCHAR(200) NOT NULL,
        estado      BIT NOT NULL DEFAULT(1)
    );
GO
