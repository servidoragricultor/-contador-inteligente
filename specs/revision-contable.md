# Spec: revision contable

## Objetivo

Dar al contador control sobre la calidad de los registros sin impedir que el cliente capture.

## Estados

- unreviewed: registro nuevo pendiente de revision.
- reviewed: registro validado por contador.
- correction_required: el contador solicita correccion.

## Reglas

- Todo registro creado por cliente inicia como unreviewed.
- Todo XML con inconsistencia inicia como correction_required o unreviewed con alerta.
- Un registro reviewed no debe ser eliminado por el cliente.
