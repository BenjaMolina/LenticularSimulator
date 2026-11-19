# Proyecto: Lenticular Optical Simulator

## 1. Objetivo

Desarrollar una aplicación web que permita simular el comportamiento óptico de imágenes lenticulares antes de imprimirlas físicamente.

El objetivo principal es reducir las pruebas de impresión, optimizar las configuraciones de entrelazado (interlacing) y minimizar el efecto de ghosting (contaminación visual entre imágenes).

La aplicación debe simular cómo se visualizan las imágenes a través de una lámina lenticular real, considerando el LPI, DPI, pitch, desplazamiento de impresión y ángulo de observación.

**IMPORTANTE:** No se busca únicamente generar una animación GIF que alterne imágenes. Se requiere implementar un modelo matemático que aproxime el comportamiento óptico de las lentes lenticulares.

## 2. Tecnologías obligatorias

- React.
- JavaScript (no TypeScript).
- Vite.
- HTML5 Canvas para procesamiento y visualización.
- WebGL como opción para acelerar la simulación óptica.
- CSS para la interfaz.
- OpenCV.js opcional para análisis y procesamiento de imágenes.

Evitar introducir un backend en la primera versión. La aplicación debe funcionar localmente desde el navegador.

No utilizar TypeScript.

## 3. Configuración inicial

La primera versión debe contemplar estos valores:

- Formato de impresión: A4.
- Orientación de lentes: vertical.
- Densidad de lentes: 50 LPI.
- Cantidad de imágenes: 2 o 3.
- Orientación del efecto: izquierda-derecha.
- Impresora: configurable, inicialmente independiente del fabricante.
- Resolución de impresión: configurable.
- Pitch: configurable con incrementos de 0.05.
- Desplazamiento horizontal (offset): configurable.

Todos los parámetros deben poder modificarse sin necesidad de cambiar el código.

## 4. Módulos principales

### 4.1. Image Manager

Permitir:

- Cargar entre 2 y 10 imágenes.
- Mostrar miniaturas.
- Reordenar imágenes.
- Eliminar imágenes.
- Recortar y ajustar las imágenes al formato seleccionado.
- Mantener la relación de aspecto.
- Soportar JPG, PNG y WebP.

### 4.2. Lens Configuration

Crear un módulo para configurar:

- LPI nominal.
- Pitch efectivo.
- DPI horizontal y vertical.
- Orientación de las lentes.
- Grosor de la lámina (opcional).
- Índice de refracción (opcional).
- Distancia de observación.
- Ángulo de visión.
- Offset horizontal.
- Factor de calibración.

Distinguir entre el LPI nominal del fabricante y el pitch efectivo obtenido mediante calibración.

### 4.3. Interlacing Engine

Implementar el algoritmo matemático de entrelazado.

Debe:

1. Recibir las imágenes originales.
2. Calcular el ancho de cada lente en píxeles.
3. Determinar qué imagen corresponde a cada franja.
4. Generar la imagen entrelazada.
5. Permitir modificar el pitch y offset.
6. Soportar entre 2 y 10 imágenes.
7. Exportar el resultado en resolución completa.

La relación entre DPI y LPI debe calcularse considerando que el número de píxeles por lente puede no ser entero.

Evitar redondeos acumulativos que provoquen desalineación progresiva.

### 4.4. Optical Simulation Engine

Este es el módulo más importante.

Implementar un modelo matemático que aproxime cómo una lente lenticular dirige diferentes franjas de la imagen hacia el observador según su posición angular.

Consideraciones:

- Geometría de lentes cilíndricas.
- Refracción de luz.
- Índice de refracción.
- Pitch de las lentes.
- Posición relativa entre lentes y franjas impresas.
- Ángulo de observación.
- Posible mezcla entre imágenes vecinas.
- Errores de alineación.

El modelo debe calcular qué proporción de cada imagen contribuye a la imagen observada desde cada ángulo.

No asumir que una imagen se ve exclusivamente dentro de un rango angular perfectamente delimitado. Considerar una función de respuesta óptica que permita representar transiciones y contaminación entre canales.

Separar claramente los cálculos geométricos de la representación visual.

Documentar las ecuaciones utilizadas y sus supuestos físicos.

### 4.5. Ghosting Analyzer

Desarrollar un módulo para calcular el crosstalk entre imágenes.

Ejemplo:

Ángulo de observación:
- Imagen principal: 85%.
- Imagen secundaria: 12%.
- Imagen terciaria: 3%.

Mostrar:

- Porcentaje de contribución de cada imagen.
- Porcentaje de ghosting.
- Ángulos donde se produce mayor contaminación.
- Comparación entre configuraciones.
- Gráficas de ghosting según el ángulo de observación.

El cálculo debe distinguir entre la mezcla óptica del modelo y las diferencias visuales reales de las fotografías.

No presentar resultados estimados como mediciones físicas certificadas.

### 4.6. Pitch Optimizer

Crear un optimizador que permita probar automáticamente diferentes configuraciones.

Parámetros:

- Rango de pitch.
- Incremento de búsqueda.
- Offset.
- Número de imágenes.
- LPI.
- DPI.

Objetivo:

Encontrar la configuración que minimice el ghosting y maximice la separación visual entre imágenes.

Mostrar las cinco mejores configuraciones encontradas y permitir compararlas.

No limitar la optimización a minimizar una métrica aislada: considerar también el equilibrio de visibilidad entre imágenes y la calidad de transición.

### 4.7. Optical Preview

Crear un visualizador interactivo.

Debe permitir:

- Mover un control deslizante para cambiar el ángulo de observación.
- Simular el movimiento izquierda-derecha.
- Ver las transiciones entre imágenes.
- Mostrar la imagen observada en tiempo real.
- Activar y desactivar la visualización de ghosting.
- Comparar el resultado con las imágenes originales.
- Visualizar las franjas de entrelazado.

La simulación debe utilizar el motor óptico y no limitarse a alternar fotografías mediante una animación.

### 4.8. Image Exporter

Permitir exportar:

- Imagen entrelazada PNG.
- Imagen entrelazada TIFF, si se implementa un codificador adecuado.
- GIF de simulación.
- Informe de configuración utilizado.
- Gráfica de ghosting por ángulo.

La exportación debe conservar las dimensiones y resolución seleccionadas para impresión.

## 5. Interfaz de usuario

Crear una interfaz moderna, limpia y profesional.

Secciones principales:

1. Dashboard.
2. Image Manager.
3. Lens Configuration.
4. Optical Preview.
5. Ghosting Analyzer.
6. Pitch Optimizer.
7. Export.

La previsualización óptica debe ocupar el espacio principal de trabajo.

Los parámetros técnicos deben estar organizados en paneles laterales.

Utilizar controles numéricos y sliders para facilitar los ajustes.

## 6. Arquitectura del proyecto

Organizar el código de manera modular:

src/
  components/
    ImageUploader/
    ImageGallery/
    LensConfiguration/
    OpticalPreview/
    GhostingAnalyzer/
    PitchOptimizer/
    ExportPanel/

  engine/
    InterlacingEngine.js
    OpticalSimulation.js
    LensModel.js
    RefractionModel.js
    GhostingAnalysis.js
    PitchOptimizer.js

  rendering/
    CanvasRenderer.js
    WebGLRenderer.js
    ImageExporter.js

  utils/
    imageUtils.js
    mathUtils.js
    opticalUtils.js

  models/
    LenticularProfile.js

  hooks/
  styles/
  App.jsx
  main.jsx

Mantener el motor óptico independiente de React para poder realizar pruebas unitarias y optimizarlo sin modificar la interfaz.

## 7. Validación física y precisión

La precisión del simulador es prioritaria.

No inventar parámetros físicos ni asumir que todos los materiales lenticulares se comportan igual.

Incorporar un sistema de calibración que permita ajustar el modelo utilizando impresiones reales.

Considerar:

- LPI nominal frente a pitch efectivo.
- Error de alineación.
- Desplazamiento de impresión.
- Distorsión o escalado del papel.
- Resolución efectiva de impresión.
- Características de la lámina.
- Variaciones en el comportamiento óptico.

El simulador debe permitir guardar perfiles de láminas para reutilizarlos en futuros trabajos.

Los resultados deben indicar qué parámetros son conocidos, cuáles son estimados y cuáles requieren calibración física.

## 8. Estrategia de desarrollo

Desarrollar el proyecto por fases.

**Fase 1: MVP**
- Interfaz React.
- Carga de 2 y 3 imágenes.
- Configuración de 50 LPI.
- DPI configurable.
- Entrelazado matemático.
- Ajuste de pitch y offset.
- Previsualización angular básica.

**Fase 2: Simulación óptica**
- Modelo geométrico de las lentes.
- Modelo de refracción.
- Mezcla de imágenes según ángulo.
- Simulación de ghosting.

**Fase 3: Optimización**
- Analizador de ghosting.
- Búsqueda automática de pitch.
- Comparación de configuraciones.
- Gráficas de resultados.

**Fase 4: Calibración**
- Perfiles de láminas.
- Ajuste mediante muestras impresas.
- Corrección de errores de impresión.
- Validación contra fotografías de pruebas reales.

**Fase 5: Producción**
- Soporte de hasta 10 imágenes.
- Formatos adicionales.
- Exportación de alta resolución.
- Perfiles específicos de impresoras.

## 9. Requisitos de calidad

- Código JavaScript limpio y modular.
- Separación entre interfaz, cálculos y renderizado.
- Evitar dependencias innecesarias.
- Procesamiento eficiente de imágenes de alta resolución.
- No bloquear la interfaz durante cálculos pesados.
- Utilizar Web Workers cuando sea necesario.
- Incluir pruebas unitarias para los algoritmos matemáticos.
- Documentar las fórmulas utilizadas.
- No presentar una simulación aproximada como si fuera una reproducción óptica exacta.

## 10. Primera tarea

Antes de implementar todo el proyecto:

1. Diseña la arquitectura.
2. Explica el modelo matemático que utilizarás para representar una lámina lenticular.
3. Explica cómo calcularás el crosstalk y el ghosting.
4. Identifica qué parámetros pueden conocerse y cuáles requieren calibración.
5. Implementa un MVP funcional con dos imágenes, 50 LPI, lentes verticales y un control interactivo de ángulo.

No intentes implementar todas las fases en una sola entrega.

Prioriza la exactitud matemática, la validación y la posibilidad de ampliar el simulador en el futuro.