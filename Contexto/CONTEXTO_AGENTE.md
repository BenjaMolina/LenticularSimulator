# CONTEXTO PARA CONTINUAR EL PROYECTO — Lenticular Optical Simulator

> Fecha de preparación: 2026-11-19. Idioma de trabajo: español.
> **Propósito:** que otro agente de IA en una máquina local pueda retomar las decisiones, contexto, alcance y prioridades de esta conversación sin reiniciar el análisis.
> **Estado:** solo hay planificación y un prompt técnico; **NO se ha programado un MVP, creado un repositorio ni validado un simulador físico todavía**.

## 1. Instrucción de inicio para el agente receptor

Actúa como ingeniero de software senior con experiencia en gráficos, procesamiento digital de imágenes y óptica computacional. Continúa el proyecto descrito aquí sin cambiar decisiones ya acordadas. Usa **React + JavaScript (NO TypeScript) + Vite**, ejecutable localmente y sin backend inicial. Diferencia cuidadosamente la previsualización digital, el modelo físico teórico y la predicción calibrada con impresiones reales. Evita inventar precisión en estimaciones de ghosting. Empieza por un diseño razonado y un MVP pequeño y verificable; implementa código real si el usuario te pide comenzar.

Para el prompt extenso ya redactado en la conversación, lee `PROMPT_IMPLEMENTACION_REACT_JS.md`.

## 2. Motivación / problema real

El usuario trabaja con impresión e imágenes lenticulares y **ya cuenta con una licencia de 3DMasterKit**. Quiere anticipar el efecto al observar una lámina lenticular **antes de imprimir**, reduciendo gasto en material, iteraciones de configuración y ghosting. Se exploraron alternativas (3DMasterKit, Imagiam, Kinetix), pero el interés final quedó en **desarrollar una simulación óptica propia**, no solo un GIF o un flip por software.

No hay evidencia de que el usuario ya tenga imágenes de prueba, muestras calibradas, óptica caracterizada ni impresora seleccionada.

## 3. Decisiones tomadas

| Tema | Decisión / estado | Origen o condición |
|---|---|---|
| Enfoque | **Opción C: simulación óptica** que intente emular observación física a través de lámina, incluyendo crosstalk | Elección expresa del usuario |
| Stack | **React + JavaScript**, explícitamente **sin TypeScript** | Elección expresa del usuario |
| Herramientas | Vite, Canvas 2D inicialmente; WebGL opcional para acelerar; CSS; OpenCV.js solo si se justifica | Propuesta incorporada al prompt |
| Ejecución | Web local, sin servidor ni backend en el MVP | Propuesta incorporada al prompt |
| Lámina | **50 LPI nominales** | Confirmación expresa del usuario |
| Lentes | **Verticales**; cambio visual al variar ángulo izquierda-derecha | Confirmación expresa del usuario |
| Impresora | **No definida todavía**; configuración genérica y perfiles por impresora después | Confirmación expresa del usuario |
| Efecto | Inicialmente flip de **2 o 3 imágenes** | Propuesta aceptada para la fase inicial |
| Tamaño | **A4** como referencia inicial | Propuesta aceptada de forma general, pendiente confirmación de márgenes y orientación |
| LPI/pitch | Distinguir LPI nominal de pitch efectivo medido | Requisito técnico indispensable |
| Ajustes | DPI/PPI, pitch, offset, ángulo de observación, perfiles | Planeado |
| Evolución | Hasta 10 imágenes, exportaciones, optimización y calibración | Planeado para etapas posteriores |

## 4. Arquitectura deseada

Separar al menos estos módulos:

1. `InterlacingEngine.js`: organiza fracciones/columnas de las imágenes bajo cada lentícula a escala física/píxeles. Sin acumular errores por redondeo.
2. `LensModel.js` / `RefractionModel.js`: modelo geométrico inicial de lente, refracción, espesor y parámetros ópticos, documentando aproximaciones.
3. `OpticalSimulation.js`: recibe interlazado, parámetros de lámina, posición del observador/ángulo y perfil de respuesta para obtener vista virtual.
4. `GhostingAnalysis.js`: calcula contribuciones/contaminación de canales por ángulo y una o varias métricas de crosstalk; distingue simulación y medición real.
5. `PitchOptimizer.js`: explora valores plausibles de pitch/offset bajo criterios físicamente justificables; nunca afirmar que optimiza lo imposible sin datos físicos.
6. `CanvasRenderer.js` (y quizá `WebGLRenderer.js`): render de previsualización y diagramas de canales en tiempo real.
7. Componentes React: cargador de imágenes, panel de lente, vista angular, gráfico de contaminación, optimizador, exportador.
8. Perfiles persistidos localmente (por ejemplo JSON exportable/importable y localStorage o IndexedDB), con versionado.

## 5. Motor óptico: consideraciones esenciales

**No confundir** estas capas:

- **Interlacing digital**: qué franja de cada imagen se coloca bajo cada lente, a una resolución/escala concreta.
- **Óptica angular**: cómo una lente dirige rayos desde las franjas hacia el observador.
- **Respuesta instrumental y de impresión**: efectos del punto impreso, dispersión, trama, ganancia de punto, registro, escalado del driver, soporte y condiciones de montaje.

La vía de desarrollo razonable:

A. MVP con entrelazado determinista y vista angular parametrizada; perfil de respuesta óptica **aproximado y marcado como no calibrado**, sin porcentajes inventados.
B. Introducir un modelo geométrico basado en Snell y/o función de dispersión angular, según datos de la lámina. Documentar ecuaciones, sistema de coordenadas y supuestos.
C. Calibrar la función de respuesta / phase offset / pitch efectivo usando pocas pruebas físicas y observaciones a ángulos conocidos.
D. Validar predicciones de ghosting contra fotografías o lecturas de muestras reales y emitir incertidumbre/error.

**Aclaraciones numéricas:** 50 lentes/pulgada equivalen a un paso nominal de 25.4/50 = **0.508 mm por lente**. Los píxeles de imagen por lente al rasterizar son `PPI_efectivo / LPI_efectivo`, que **puede ser no entero**. El DPI nominal máximo anunciado por una impresora no equivale necesariamente a la resolución de imagen que acepta o imprime el controlador; diferenciar DPI del dispositivo y PPI del archivo.

El ajuste de pitch en pasos de **0.05** apareció en el prompt anterior pero **no se especificó la unidad** (LPI, píxeles, porcentaje, mm). El agente no debe fijar una interpretación arbitraria: usar una representación interna física clara (por ejemplo mm/lente), exponer unidades en UI y escoger pasos adecuados. El pitch efectivo solo debe optimizarse en un rango físicamente plausible.

**Límite fundamental:** ni el modelo sin datos de fabricante ni el algoritmo de optimización pueden garantizar ausencia de ghosting. El crosstalk intrínseco de la lente, la impresión y la separación de vistas pueden dominar. El optimizador solo recomienda con fundamento dentro de las hipótesis calibradas.

## 6. UX propuesta

- Panel central grande de previsualización angular, usando un deslizador de ángulo y opción de interacción con mouse.
- Controles de 50 LPI, pitch, unidades, offset, resolución de imagen, tamaño de salida y orientación.
- Carga de 2 o 3 archivos JPG/PNG/WebP con miniaturas; más imágenes después.
- Visualización de imagen entrelazada y vista simulada.
- Desglose de aportación de cada imagen, gráfica por ángulo y aviso visible de estimación no calibrada.
- Comparador entre perfiles/calibraciones.
- Exportación PNG de imagen entrelazada y parámetros de trabajo; TIFF/GIF/reportes después.

## 7. Hitos y criterios de aceptación sugeridos

**MVP 1 (primero):** proyecto Vite + React + JavaScript; carga de 2 imágenes; perfil 50 LPI vertical; PPI de imagen configurable; franjeado/rejilla sin error acumulativo; slider angular; vista que responde de modo continuo conforme a un kernel de mezcla explícito; exportación PNG; tests sobre pitch, fase y bordes. Etiqueta clara: `simulación no calibrada`.

**MVP 2:** 3 imágenes, gráfico de aporte por canal, visualización diagnóstica de ghosting, comparativa de configuraciones, rendimiento con Workers si se necesita.

**MVP 3:** geometría y refracción documentadas; parámetros físicos (índice n, espesor, distancia observador) identificados como conocidos/asumidos; pruebas de consistencia física; validación de rangos.

**MVP 4:** flujo de calibración con impresión de patrón y capturas a ángulos conocidos, importación de datos, cuantificación de incertidumbre y predicción revisada.

**MVP 5:** optimización y perfiles de impresora/lámina con prueba de campo; exportación de alta resolución.

Evitar que el 'ghosting %' sea únicamente una métrica ficticia o se derive de una animación cruzada sin fundamento óptico. La app debe diferenciar **mezcla de canales calculada**, **contaminación percibida del contenido** y **medición física**.

## 8. Pendientes y preguntas para resolver cuando sean necesarios

- Modelo exacto de impresora, controladores, medio, DPI/PPI efectiva, perfil de color.
- Marca, fabricante, espesor, índice de refracción, distancia focal o ángulo de visión de la lámina 50 LPI.
- Lámina adherida sobre impresión o impresión directa; espesor de adhesivo; cara de observación.
- Cómo se obtendrá el pitch calibrado: impresión de patrón, lente test, fotografía macro, observación a ángulos.
- Distancia típica de observación y tolerancia de ghosting en el flujo de producción.
- ¿La aplicación debe leer exportaciones ya entrelazadas de 3DMasterKit o solo imágenes originales?
- Orientación A4 exacta, área imprimible/sangrado y recorte.

Estas preguntas **no son bloqueantes para crear un MVP**. Diseñar valores ilustrativos editables, documentados como supuestos.

## 9. Instrucción práctica para continuar

El usuario ya solicitó un prompt para trabajar más adelante con IA. Se adjunta íntegro como `PROMPT_IMPLEMENTACION_REACT_JS.md`, además de una reconstrucción textual cronológica del diálogo en `TRANSCRIPCION_CONVERSACION.md` y decisiones estructuradas en `DECISIONES_PROYECTO.json`.

Al continuar, prioriza fidelidad física, robustez y arquitectura modular. **No afirmes que ya existe una aplicación funcional**. Si el usuario pide implementarla, comienza por el MVP ejecutable, explica cómo iniciar `npm install` y `npm run dev`, y escribe pruebas de cálculos críticos.
