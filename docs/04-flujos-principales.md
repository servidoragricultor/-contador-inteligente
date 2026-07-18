# Flujos principales

## Flujo del contador

1. Inicia sesion.
2. Ve lista de empresas/clientes.
3. Crea una empresa.
4. Invita al cliente.
5. Entra a la empresa.
6. Revisa ingresos y gastos.
7. Corrige categorias o datos.
8. Marca registros como revisados.
9. Exporta Excel cuando lo necesita.

## Flujo del cliente

1. Recibe invitacion.
2. Crea acceso.
3. Entra a su empresa.
4. Registra ingreso, registra gasto o sube XML.
5. Corrige informacion si el contador lo solicita.

## Registro manual de ingreso

Campos visibles:

- Monto.
- Fecha.
- Cliente o descripcion.
- Estado: cobrado o pendiente.
- Nota opcional.

## Registro manual de gasto

Campos visibles:

- Monto.
- Fecha.
- Proveedor o descripcion.
- Categoria.
- Estado: pagado o pendiente.
- Nota opcional.

## Importacion XML

1. Usuario sube XML.
2. Sistema lee datos CFDI.
3. Sistema compara RFC emisor y receptor contra RFC de empresa.
4. Sistema crea ingreso, gasto o registro en revision.
5. Sistema alerta duplicados o inconsistencias.
