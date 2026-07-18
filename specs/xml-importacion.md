# Spec: importacion XML

## Objetivo

Leer CFDI XML y crear automaticamente ingresos o gastos.

## Comportamiento esperado

- Permitir subir uno o varios XML.
- Extraer datos fiscales y economicos.
- Detectar ingreso o gasto por RFC.
- Crear transaccion automaticamente si el XML es valido.
- Marcar requiere revision cuando haya inconsistencias.

## Errores controlados

- UUID duplicado.
- XML invalido.
- RFC de empresa no coincide.
- Total igual o menor a cero.
- Datos obligatorios ausentes.
