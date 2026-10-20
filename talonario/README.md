# Talonario · facturas para autónomos

Una sola página (`index.html` + la carpeta `fonts/`) que hace una factura de autónomo en 30 segundos y la descarga en PDF. Sin servidor, sin cuentas, sin gastos fijos: todo pasa en el navegador del usuario.

Qué hay en la carpeta: `index.html` (la app), `fonts/` (tipografías servidas desde tu dominio), `aviso-legal.html` y `privacidad.html` (con huecos `[[…]]` que rellenas tú), `og.png` (imagen al compartir el enlace), `robots.txt`, `sitemap.xml`, `README.md`, `LANZAMIENTO.md` (orden de trabajo para lanzar) y `test/` (prueba automática; no hace falta subirla).

**Modelo de ingresos:** gratis con la línea «Hecho con Talonario» al pie del PDF; **Pro, 19 € de pago único**, la quita y añade logo, clientes guardados, historial y plantilla moderna. El pago se hace en Lemon Squeezy o Gumroad; el comprador recibe una clave por correo, la pega en la web y Pro queda activado en su navegador.

## Publicar (10 minutos)

1. Sube la carpeta `talonario/` entera (con `fonts/`; `test/` no hace falta) a tu hosting. Vale Hostinger, o gratis en Cloudflare Pages o Netlify arrastrando la carpeta.
2. Ponle un dominio propio cuando puedas (`talonario.app`, `talonario.es`…). Mientras tanto funciona en cualquier ruta.
3. Cambia `talonario.app` por tu dominio: en `CONFIG.site` (al principio del `<script>`; es lo que aparece en la línea del PDF), en las etiquetas `canonical`, `og:url` y `og:image` del `<head>`, y en `robots.txt` y `sitemap.xml`.

## Cobrar

**Lemon Squeezy (recomendado):** actúa como vendedor oficial, así que calcula y liquida él el IVA de cada país del comprador. Tú no tienes que darte de alta en el régimen de IVA de la UE para vender fuera de España.

1. Crea el producto «Talonario Pro» a 19 € con el precio marcado como «impuestos incluidos» (el aviso legal dice 19 € impuestos incluidos). En el producto activa **License keys** con límite de activaciones 3: la app activa la clave con `/v1/licenses/activate`, así que el límite se cumple de verdad (`CONFIG.maxActivaciones` solo sirve para el texto del error).
2. Copia el enlace de compra en `CONFIG.checkoutUrl` y el id numérico del producto en `CONFIG.productId`. Deja `provider: 'lemonsqueezy'`.
3. La clave de prueba `TALONARIO-DEMO` (`CONFIG.demoCode`) solo funciona mientras `checkoutUrl` está vacío: en cuanto pegues el enlace de pago deja de valer. Puedes borrarla igualmente.

**Gumroad:** mismo proceso con `provider: 'gumroad'`, el enlace del producto en `checkoutUrl` y su `product_id` en `productId`. Activa «Generate a unique license key per sale».

Al pagar, la clave llega por correo. El usuario pulsa «Pro · 19 €», la pega y listo. Si cambia de navegador, la vuelve a pegar (cada vez cuenta como una activación).

## Legal, antes de lanzar

- **Aviso legal y privacidad:** ya están (`aviso-legal.html`, `privacidad.html`, enlazadas desde el pie). Busca `[[` en las dos y rellena nombre, NIF, dirección, correo, fecha, plataforma de pago y hosting. Si añades analítica, actualiza la página de privacidad.
- **Veri*Factu:** es la obligación de que los programas de facturación en España registren cada factura ante la Agencia Tributaria. Se ha aplazado varias veces; la última previsión es 2027 (antes sociedades, después autónomos). Comprueba la fecha vigente en la web de la AEAT. La app lo dice junto al botón de descargar y en la FAQ. Cuando sea obligatoria, Talonario tal como está (un generador de PDF) no bastará para emitir facturas en España: tendrás que adaptarlo o limitarlo a presupuestos y a otros países.

## Cómo se promociona

- **Buscar en Google:** la página está preparada para «hacer factura autónomo», «factura con retención IRPF», «generador de facturas gratis», «factura sin IVA». Las preguntas frecuentes llevan datos estructurados (FAQ) para salir con más espacio en los resultados.
- **TikTok y Reels:** el formato de los vídeos de AniRadar vale aquí. Ganchos: «Cómo hacer tu primera factura de autónomo en 30 segundos», «El error del IRPF que cometen todos los autónomos nuevos» (7 % vs 15 %), «Factura a un particular vs a una empresa».
- **Donde están los autónomos:** grupos y foros de freelancers, Reddit (r/autonomos), comentarios en vídeos sobre darse de alta como autónomo.

## Límites conocidos

- Pro se guarda en el navegador y la clave solo se comprueba al pegarla. Alguien con conocimientos puede activarlo editando `localStorage`; para un producto de 19 € sin servidor es un riesgo aceptable.
- El número de factura se apunta como usado al pulsar «Descargar PDF» (y al imprimir con Ctrl+P). Si el usuario cancela la ventana de imprimir, el número ya está gastado: la app avisa y propone el siguiente libre; se puede corregir a mano.
- Presupuestos y proformas tienen numeración propia y no gastan números de factura. La «Factura simplificada» (clientes particulares) no exige NIF ni domicilio del cliente y avisa por encima de 400 €.
- Fuera de España (México, Argentina, Colombia, Chile, Perú) el documento es un recibo, cuenta de cobro o presupuesto, no la factura electrónica oficial; la app lo indica.
- Los datos viven en el navegador del usuario: si borra los datos de navegación, pierde el historial. La web lo avisa y Pro puede exportar una copia en JSON.
- El PDF se genera con «Imprimir → Guardar como PDF» del navegador. Funciona en Chrome, Safari (también en iPhone), Firefox y Edge.

## Probar en local

Sirve la carpeta por HTTP (por ejemplo `python3 -m http.server 8000` dentro de `talonario/` y abre `http://localhost:8000/`): abriendo el archivo directamente el navegador no carga las fuentes locales. Para probar Pro, pulsa «Pro · 19 €» y pega `TALONARIO-DEMO`.

Prueba automática (necesita Node y Playwright con Chromium): `node talonario/test/smoke.mjs`. Rellena una factura, comprueba cálculos, el PDF real (una página, y varias con 32 líneas), Pro, los presets y el móvil; deja capturas y PDF en `talonario/test/out/`.
