# Lanzar Talonario

Orden de trabajo para pasar de «está en el repositorio» a «cobra». Cada paso dice quién lo hace: **tú** (necesita tus cuentas) o ya está hecho.

## 1. Lista de lanzamiento

| Paso | Quién | Cómo |
|---|---|---|
| Rellenar los huecos en rojo de `aviso-legal.html` y `privacidad.html` (nombre, NIF, dirección, correo, fecha, plataforma de pago, hosting) | tú | Busca `[[` en los dos archivos |
| Crear el producto Pro y las claves de licencia | tú | Sección 2 |
| Pegar `checkoutUrl` y `productId` en `CONFIG` (la clave de prueba `TALONARIO-DEMO` deja de funcionar sola en cuanto hay `checkoutUrl`) | tú | Al principio del `<script>` de `index.html` |
| Cambiar `talonario.app` por tu dominio en `CONFIG.site`, las etiquetas `canonical`, `og:url` y `og:image` de `index.html`, `robots.txt` y `sitemap.xml` | tú | Buscar y reemplazar |
| Subir la carpeta `talonario/` entera (con `fonts/`, `og.png`, `robots.txt`, `sitemap.xml`; `test/` no hace falta) | tú | Hostinger, o gratis en Cloudflare Pages / Netlify |
| Hacer una compra real de prueba y activar la clave | tú | Lemon Squeezy tiene modo de prueba con tarjeta `4242 4242 4242 4242` |
| Dar de alta el dominio en Google Search Console y enviar `sitemap.xml` | tú | search.google.com/search-console |
| Analítica sin cookies (opcional) | tú | Cloudflare Web Analytics es gratis y no necesita banner; si la pones, añade una línea en `privacidad.html` |
| Publicar el vídeo de TikTok y los mensajes de la sección 4 | tú | `tiktok/out/talonario*.mp4` |

## 2. Lemon Squeezy paso a paso

1. Crea la cuenta y la tienda. Activa el modo **Test** para probar sin cobrar.
2. **Products → New product:** nombre «Talonario Pro», precio 19 €, tipo «Single payment». Marca el precio como **impuestos incluidos** (tax-inclusive): el aviso legal promete 19 € con impuestos.
3. En el producto, pestaña **License keys:** actívalas y pon «Activation limit» en 3 (tres navegadores o dispositivos por compra). La app activa la clave en Lemon Squeezy al pegarla, así que ese límite se aplica de verdad.
4. Pestaña **Checkout:** copia el enlace «Share → Checkout link». Ese es `CONFIG.checkoutUrl`.
5. El id numérico del producto está en la URL del panel (`/products/123456`). Ese es `CONFIG.productId`.
6. **Settings → Emails:** en el correo de entrega deja claro qué hacer con la clave. Texto sugerido:

   > Gracias por comprar Talonario Pro. Tu clave está abajo. Entra en talonario.app, pulsa «Pro · 19 €», pega la clave y dale a «Activar». Si cambias de navegador, vuelve a pegarla. ¿Algo no funciona? Responde a este correo.

7. Haz una compra en modo Test, pega la clave en la web y comprueba que desaparece la línea «Hecho con Talonario» del PDF. Luego desactiva el modo Test.

Lemon Squeezy actúa como vendedor oficial: calcula y liquida el IVA del comprador en cada país y te paga a ti el neto. Cobra una comisión por venta y no tiene cuota mensual.

**Descripción del producto (pégala en Lemon Squeezy):**

> **Talonario Pro.** Facturas para autónomos sin la línea «Hecho con Talonario» en el PDF. Incluye tu logo en la factura, clientes guardados con autocompletado, historial para reabrir, duplicar y volver a descargar facturas, y la plantilla moderna. Pago único, sin suscripción. Funciona en tu navegador: tus datos nunca salen de tu ordenador.

## 3. El precio

19 € de pago único es una cifra fácil de decidir sin pensarlo y cubre una factura al mes de lo que cuestan las apps de suscripción. Alternativas para probar más adelante, cambiando solo el texto y el precio en Lemon Squeezy:

- **29 €** si ves que la gente compra sin dudar.
- **4,99 €/mes** si quieres ingresos recurrentes: Lemon Squeezy también genera claves para suscripciones y la app ya comprueba el estado de la clave al activarla. Haría falta volver a comprobarla de vez en cuando (hoy solo se comprueba al pegarla).

## 4. Mensajes para publicar

**Hilo o publicación en X, LinkedIn y Reddit (r/autonomos, r/spain, foros de freelancers):**

> He hecho una web para hacer facturas de autónomo sin registrarte ni pagar suscripción: Talonario. Rellenas, calcula el IVA y la retención, y descargas el PDF. Tus datos no salen de tu navegador. Es gratis; si quieres quitar la línea del pie y guardar clientes, hay un pago único de 19 €. Me vendría bien que la probarais con una factura real y me dijerais qué falta. [enlace]

Reglas: publícalo una vez por sitio, responde a todos los comentarios y, cuando te pidan algo, dilo en público cuando lo tengas hecho. No enlaces desde cuentas que no sean tuyas.

**Ganchos para TikTok y Reels (uno por vídeo, 20–30 s, grabando la pantalla):**

1. «Cómo hacer tu primera factura de autónomo en 30 segundos.»
2. «El error del IRPF que cometen los autónomos nuevos» (7 % los tres primeros años, 15 % después).
3. «Factura a un particular vs a una empresa: qué cambia.»
4. «¿Factura sin IVA? Esto es lo que tiene que poner.»
5. «La factura que me pagan antes: el sello de PAGADA.»
6. «Qué tiene que llevar una factura para que Hacienda no te la tumbe.»
7. «Numerar facturas sin liarte: una serie por año.»
8. «Hice una app de facturas que no te pide ni el correo.»

Texto fijo para la descripción: «Talonario, facturas para autónomos. Gratis y sin registro. Enlace en el perfil.» Hashtags: #autonomos #autonomo #facturas #freelance #emprender.

## 5. Buscadores

Palabras por las que la página ya puede posicionar: «hacer factura autónomo», «generador de facturas gratis», «factura con retención IRPF», «factura sin IVA exenta», «plantilla factura autónomo pdf», «cómo numerar facturas».

Para crecer, añade una guía por semana como página aparte (`guias/…html`), enlazada desde el pie, con el mismo diseño: «Cómo hacer una factura si eres autónomo (con ejemplo)», «Retención de IRPF del 7 % o del 15 %: cuál te toca», «Factura sin IVA: casos y texto exacto», «Factura rectificativa: cuándo y cómo», «Facturar a un cliente de la UE». Cada guía termina con el botón «Hazla ahora en Talonario».

## 6. Las dos primeras semanas

- **Días 1–2:** pasos de la lista de lanzamiento, compra de prueba, Search Console.
- **Días 3–5:** vídeo 1 en TikTok y Reels; publicación en una comunidad por día.
- **Días 6–10:** vídeos 2, 3 y 4; primera guía; responde a todo.
- **Días 11–14:** mira qué vídeo trajo más visitas y haz dos variaciones; segunda guía; si hay ventas, pregunta a cada comprador por correo qué le falta.

Qué mirar cada semana: visitas, cuántas descargan un PDF (no se puede medir sin analítica; Cloudflare Web Analytics te da visitas y páginas), ventas en Lemon Squeezy y preguntas repetidas. Las preguntas repetidas son las próximas guías.
