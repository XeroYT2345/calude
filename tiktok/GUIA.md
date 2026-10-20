# Vídeos de TikTok para AniRadar

## Los anuncios principales (estilo «app promo»)

| Vídeo | Qué es | Archivo |
|---|---|---|
| **Con tu grabación real** ⭐ | Intro de marca → tu móvil usando AniRadar de verdad (Dragon Ball, Naruto, dónde verlo en España, personajes, calendario, tendencias, Chainsaw Man) con títulos animados, tarjetas flotantes y la mascota → final de marca. ~44 s | `aniradar-real.mp4` |
| Animado | Lo mismo pero 100 % dibujado (sin imágenes de anime). ~43 s | `aniradar-promo.mp4` |

Cada uno tiene una versión **`-sin-musica.mp4`** con solo los efectos de sonido, para que pongas encima un sonido de TikTok.
La música y los efectos están generados por código (`audio.py`): son originales, no hay riesgo de reclamación.

**Sobre las portadas que salen en la grabación real:** son las carátulas oficiales que muestra tu web. Es lo que hacen casi todas las cuentas de anime y TikTok rara vez lo detecta solo, pero el dueño de los derechos puede denunciar un vídeo y retirarlo. Lo que de verdad hace saltar el sistema son **clips de episodios y canciones**: no los añadas.

## Vídeos cortos (~17 s, 100 % gráficos)

| Vídeo | Qué promociona | Archivo |
|---|---|---|
| ¿Viste un anime y NO recuerdas el nombre? | Identificador por trama y por captura | `identifica.mp4` |
| ¿No sabes qué anime ver hoy? | El test `que-anime-ver.html` | `que-anime-ver.mp4` |
| ¿A qué hora sale el próximo episodio en TU país? | Calendario, recordatorios y dónde verlo legal | `calendario.mp4` |

## Antes de publicar: reglas para que no te bloqueen

1. **Música: la nuestra o una de TikTok.** Los anuncios principales ya llevan música original. Si prefieres un sonido de moda, usa la versión `-sin-musica` y añádelo desde TikTok; los vídeos cortos van en silencio a propósito. Si tu cuenta es de empresa, solo podrás elegir de la *Commercial Music Library*, que es la opción segura para contenido promocional. **Nunca** metas openings de anime ni canciones descargadas.
2. **Marca el contenido como promocional.** En «Más opciones → Divulgación de contenido» activa **«Tu marca»**, porque estás promocionando tu propia web. No es obligatorio en todos los casos, pero evita problemas con la política de contenido comercial.
3. **El enlace va en el perfil, no en el vídeo.** Pon `aniradar.net` en la biografía. TikTok solo deja poner enlace clicable a algunas cuentas (empresa o con suficientes seguidores, según el país). Mientras tanto basta con el texto «aniradar.net» en la bio, que ya aparece en el vídeo.
4. **No pidas interacción a cambio de nada.** Evita «dale like si…», «comenta 1 y te lo paso» o «sígueme para la parte 2» sin parte 2: TikTok lo trata como *engagement bait* y te baja el alcance.
5. **No subas el mismo vídeo varias veces** ni en varias cuentas, y no compres seguidores ni vistas. Publica 1 vídeo al día como mucho.
6. **Etiqueta de IA:** no hace falta, porque son gráficos animados y no imágenes realistas generadas por IA. Si algún día usas una voz o una cara generadas por IA, actívala.
7. **Sin marcas de agua de otras apps.** Si los subes también a Reels o Shorts, usa los MP4 originales, no los descargados de TikTok.
8. **No digas nada que no sea verdad.** Todo lo que dicen los vídeos lo hace tu web: es gratis, no pide registro, tiene 20 países y 6 idiomas y el recordatorio avisa 10 minutos antes. Mantenlo así si cambias textos.

## Textos para publicar (copiar y pegar)

**aniradar-real.mp4 / aniradar-promo.mp4**
> Buscas un anime por su nombre (o por lo que recuerdas de la trama) y AniRadar te dice cuál es, dónde verlo LEGAL en tu país, el orden de las temporadas y cuándo sale el próximo episodio. Gratis y sin registro → aniradar.net (enlace en el perfil)
>
> #anime #animeespañol #animetok #otaku #dondeveranime

**identifica.mp4**
> ¿Te ha pasado? Ves un trozo de anime en un vídeo y no hay forma de saber cuál es 😩 Con AniRadar lo describes con tus palabras o subes una captura y te dice el anime, el episodio y dónde verlo legal en tu país. Gratis y sin registro → aniradar.net (enlace en el perfil)
>
> #anime #animeespañol #animetok #otaku #recomendacionesanime

**que-anime-ver.mp4**
> No sé qué anime ver → 3 preguntas → 6 recomendaciones. ¿Acción, risas, misterio o romance? Pruébalo gratis en aniradar.net/que-anime-ver (enlace en el perfil)
>
> #anime #queanimever #recomendacionesanime #animetok #otaku

**calendario.mp4**
> Cuenta atrás de los próximos episodios en TU hora local y recordatorio al calendario 10 min antes 🔔 Y además te dice dónde verlo legal en tu país. aniradar.net
>
> #anime #animeespañol #estrenosanime #animetok #otaku

## Consejos para que lleguen a más gente

- **Ponle tu voz.** Graba encima la frase del gancho («¿Viste un anime y no recuerdas el nombre?») con el micrófono de TikTok. Los vídeos con voz original suelen tener más alcance que los mudos con música.
- **Portada:** elige el primer segundo (el gancho grande) como portada. También tienes `*-portada.jpg`.
- **Responde comentarios con vídeo:** si alguien pregunta «¿y qué anime es el de…?», búscalo en AniRadar y responde con un vídeo grabando tu pantalla. Ese contenido es tuyo y genera mucha interacción. Al grabar la pantalla, **evita mostrar escenas o tráileres del anime**: con la ficha y el resultado basta.
- **Horario:** prueba entre las 18:00 y las 22:00 de tu país y mira en las estadísticas cuál funciona mejor.

## Volver a generarlos o hacer más

Todo se dibuja con código (canvas) y se graba con Playwright + ffmpeg; el audio sale de `audio.py` (numpy).

```bash
npm i playwright && npx playwright install chromium   # solo la primera vez (y pip install numpy)

# Anuncio con tu grabación real: 1) extrae los fragmentos de clips.json  2) renderiza
node tiktok/clips.mjs ruta/a/tu-grabacion.mp4
node tiktok/promo.mjs --page promo-real.html --name aniradar-real

node tiktok/promo.mjs                       # anuncio animado (promo.html)
node tiktok/render.mjs                      # los 3 vídeos cortos (render.html)
node tiktok/promo.mjs --page promo-real.html --stills   # solo fotogramas sueltos para revisar
```

- **Con otra grabación:** cambia en `clips.json` los segundos `in`/`out` de cada fragmento (y `speed` para acelerarlo).
- **Textos:** los títulos de cada tramo están en `promo-real.html` (`add({ head: … })`). Usa `*palabra*` para ponerla en naranja y `|` para el salto de línea.
- `engine.js` tiene lo común: mascota, móvil, tarjetas, tipografía animada y transiciones.

## Anuncio de Talonario (`promo-talonario.html`)

El mismo motor sirve para otros productos: `engine.js` lee `window.THEME` (colores, fuentes, fondo) si la página lo define antes
de cargarlo; sin THEME, los anuncios de AniRadar se dibujan exactamente igual. `promo-talonario.html` usa el tema de Talonario
(papel, tinta, sello rojo, Bricolage Grotesque e IBM Plex Mono desde `fonts-talonario/`) y, en lugar de la mascota, el sello de goma.

Los fragmentos del móvil son la app real grabada con Playwright (`clips/cliente`, `concepto`, `linea`, `hoja`, `pagada`, `pdf`),
con las marcas de cada tecla, toque y golpe de sello guardadas en `clips/index.js` para sincronizar los efectos.

```bash
node tiktok/clips-talonario.mjs                                   # 1) graba la app (talonario/index.html) en un móvil de 390×755; ~1 min
node tiktok/promo.mjs --page promo-talonario.html --name talonario --stills   # fotogramas sueltos para revisar (TIMES=1,5,20 para elegirlos)
node tiktok/promo.mjs --page promo-talonario.html --name talonario           # 2) renderiza talonario.mp4 y talonario-sin-musica.mp4 (~38 s)
```

- **Textos:** los títulos de cada tramo están en `promo-talonario.html` (`add({ head: … })`); `*palabra*` la pone en rojo sello y `|` salta de línea.
- **Otra grabación:** cambia las acciones en `clips-talonario.mjs` (`record('id', …)`); `--only cliente,pdf` regraba solo esos y conserva el resto.
- Todo lo que dice el vídeo lo hace la web: gratis, sin registro, IVA e IRPF automáticos, sello «Pagada», PDF, y Pro a 19 € una sola vez.
