# Spec: ingresos

## Objetivo

Permitir registrar entradas de dinero o facturas emitidas de forma manual o por XML.

## Registro manual

Campos visibles:

- Monto.
- Fecha.
- Cliente o descripcion.
- Estado: cobrado o pendiente.
- Nota opcional.

## Registro por XML

Si el RFC emisor coincide con el RFC de la empresa, el XML se registra como ingreso.

## Estados financieros

- collected.
- pending.
- cancelled.

## Estado de revision

- unreviewed.
- reviewed.
- correction_required.
