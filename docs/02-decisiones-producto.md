# Decisiones de producto

## Iniciar con ingresos y gastos

Se inicia con ingresos y gastos porque el contador necesita que su cliente capture informacion operativa basica desde el sistema.

La idea original de solo compras y gastos se amplio porque el contador pidio acceso para que el cliente tambien registre ingresos.

## Incluir cliente desde etapa 1

El producto sera colaborativo desde el inicio. Esto evita construir una herramienta solo interna para el contador y despues rehacer permisos y flujos.

## Mantener permisos simples

Solo existiran dos roles iniciales: contador y cliente.

No se implementaran permisos granulares todavia porque agregan complejidad antes de validar el flujo principal.

## Separar estado financiero y estado de revision

Un registro puede estar pagado o pendiente, pero ademas puede estar sin revisar, revisado o requerir correccion.

Esta separacion ayuda al contador a controlar calidad sin mezclarla con el estado financiero.

## No incluir conciliacion bancaria todavia

La conciliacion bancaria es importante para la vision final, pero no pertenece al primer bloque de validacion.

Primero se validara que cliente y contador registren informacion de forma ordenada.

## No construir contabilidad completa

El producto no debe obligar al usuario a capturar cuentas contables, polizas o clasificaciones complejas en esta etapa.
