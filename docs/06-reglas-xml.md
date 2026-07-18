# Reglas XML

## Deteccion de tipo

- Si RFC emisor es igual al RFC de la empresa, el XML representa un ingreso.
- Si RFC receptor es igual al RFC de la empresa, el XML representa un gasto.
- Si ningun RFC coincide, el registro queda como requiere revision.

## Datos a extraer

- UUID.
- Fecha.
- Folio.
- RFC emisor.
- Nombre emisor.
- RFC receptor.
- Nombre receptor.
- Regimen fiscal cuando este disponible.
- Uso CFDI cuando este disponible.
- Subtotal.
- IVA.
- Retenciones.
- Total.
- Moneda.
- Forma de pago.
- Metodo de pago.
- Conceptos.

## Validaciones iniciales

- UUID no debe repetirse dentro de la misma empresa.
- El XML debe ser valido.
- El total debe ser mayor a cero.
- Debe existir RFC emisor y RFC receptor.
- Si el RFC no coincide con la empresa, no bloquear automaticamente; marcar requiere revision.

## Decision importante

No se integrara validacion SAT de cancelacion en etapa 1.
