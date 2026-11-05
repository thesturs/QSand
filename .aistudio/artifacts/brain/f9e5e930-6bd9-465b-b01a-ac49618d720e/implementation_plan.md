# Thermal Heatmap Overlay & Brush Physics Refinement

Implement a Thermal Heatmap toggle in the top HUD (placed in the top-right toolbar cluster next to zoom) rendering a classic blue-to-red temperature gradient overlay, and refine element brush physics so that painting over existing matter requires holding the Shift key to prevent accidental over-writes.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following choices were confirmed during the interactive interview:
> - **Heatmap Gradient Style**: Classic blue-to-red thermal gradient (blue for cold/ambient, cyan/green for moderate, yellow/red for hot/incendiary).
> - **Brush Physics Overwrite**: Require holding the **Shift** key to overwrite existing non-empty matter when painting with element brushes. Without Shift, brushes only draw onto empty space.
> - **Heatmap Placement**: Top-right toolbar cluster next to zoom controls in the canvas header.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a real-time thermal gradient visualization mode (`Thermal Heatmap`) that overlays temperature distributions across the simulation grid, alongside robust brush logic preventing accidental destruction of existing matter unless Shift is held.
- **Target Audience / Persona**: Cellular automata sandbox operators, physics experimenters, and reactor containment engineers.
- **Key Value**: Immediate thermal diagnostics of exothermic reactions, nuclear chain reactions, and fire propagation, paired with precise brush control.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. Click the **Heatmap** toggle button in the top-right HUD.
  2. The canvas renders a semi-transparent blue-to-red thermal gradient overlay reflecting cell temperatures (`temperature` property ranging from 20°C to 2500°C+).
  3. While drawing with element brushes, clicking on existing cells will leave them untouched unless the **Shift** key is held down.
- **Visual Identity & Theme**: Clean, zero-clutter professional scientific UI consistent with the existing Tailwind/Slate design system.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1**: Canvas Overlay Rendering vs WebGL Shader
  - *Chosen Approach*: 2D canvas imageData / color mapping overlay pass over the simulation canvas.
  - *Why*: Lightweight, perfectly synchronized with particle updates, and fully supports flexible blue-to-red gradient mapping without shader complexity.
- **Decision 2**: Shift-Key Overwrite Protection
  - *Chosen Approach*: Intercept pointer interaction handlers in `ResizableCanvasStage` / `simulation.ts` to check `e.shiftKey` before replacing non-empty cells (`cell.type !== TYPE_EMPTY`).
  - *Why*: Eliminates accidental brush-physics confusion when painting near active reactions.

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│               ResizableCanvasStage.tsx                 │
│  - Top-Right HUD: Thermal Heatmap Toggle & Zoom        │
│  - Pointer Event Handlers (Shift-key overwrite check)  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   simulation.ts                        │
│  - getPixelTemperature(x, y)                           │
│  - Render Heatmap Overlay (Blue-Cyan-Yellow-Red)       │
└────────────────────────────────────────────────────────┘
```
