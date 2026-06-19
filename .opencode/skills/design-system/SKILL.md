---
name: tec-design-system
description: >
  Guía del sistema de diseño visual (Claymorphism, colores Cyan y tipografía N27) para tec-virtual.
  Trigger: Al crear o editar componentes visuales de UI, estilos CSS o interfaces HUD en el proyecto.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Usar esta skill siempre que se vaya a crear o modificar un elemento visual del juego, interfaces HUD, botones, popups, paneles informativos o cualquier archivo CSS/módulo CSS.

## Critical Patterns

El proyecto cuenta con una identidad visual premium y moderna basada en **Claymorphism** (formas infladas y suaves con profundidad neumórfica tridimensional).

### 1. Tipografía
- Se utiliza la fuente premium **`N27`** (`Regular`, `Bold`, `Light`).
- **NUNCA** utilices fuentes de sistema genéricas como `Inter`, `system-ui` o `Arial` en elementos principales de la UI.
- Aplicar `font-family: 'N27', system-ui, sans-serif;`.

### 2. Estilo Visual Claymorphism (Cards Claras)
- **Fondo:** `rgba(255, 255, 255, 0.95)` (blanco de alta opacidad con desenfoque de fondo).
- **Bordes:** Redondeados generosos. El estándar para tarjetas grandes es `border-radius: 40px`. Para botones o prompts, `border-radius: 16px`.
- **Bordes finos:** `2px solid rgba(255, 255, 255, 0.4)`.
- **Filtro de Fondo:** `backdrop-filter: blur(8px)`.
- **Sombras de volumen (Fórmula Claymorphism):**
  ```css
  box-shadow:
    12px 12px 24px rgba(166, 180, 200, 0.3),          /* Sombra exterior */
    inset 8px 8px 16px rgba(255, 255, 255, 0.9),       /* Brillo interior (arriba-izquierda) */
    inset -8px -8px 16px rgba(166, 180, 200, 0.45);    /* Sombra interior (abajo-derecha) */
  ```

### 3. Colores y Contraste
- **Color de Acento:** Cian brillante (`#0ea5e9` o `rgba(14, 165, 233)`).
- **Texto principal/títulos:** `#0ea5e9` con `font-weight: 800`.
- **Texto descriptivo/cuerpo:** `#475569` (slate-600) con `font-weight: 400`.
- **Botones Interactivos:** SIEMPRE utiliza el componente React `ClayButton.jsx` en lugar de la etiqueta nativa `<button>`. Soporta las props `variant="cyan-solid" | "cyan-light" | "translucent"`. Tienen un padding global de `10px 24px` y fuente a `0.9rem`.

---

## Code Examples

### CSS Module para Tarjetas o Paneles de UI (`MyComponent.module.css`)
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 40px;
  box-shadow:
    12px 12px 24px rgba(166, 180, 200, 0.3),
    inset 8px 8px 16px rgba(255, 255, 255, 0.9),
    inset -8px -8px 16px rgba(166, 180, 200, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 24px;
  font-family: 'N27', system-ui, sans-serif;
}

.title {
  font-family: 'N27', system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: #0ea5e9;
  margin-bottom: 8px;
}

.bodyText {
  font-family: 'N27', system-ui, sans-serif;
  font-weight: 400;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}
```
