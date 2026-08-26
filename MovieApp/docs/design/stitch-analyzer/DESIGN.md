---
name: Lumina Spatial OS
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e7bdb7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ad8883'
  outline-variant: '#5d3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#ff5545'
  on-primary-container: '#5c0002'
  inverse-primary: '#c0000a'
  secondary: '#c9c6c5'
  on-secondary: '#313030'
  secondary-container: '#484646'
  on-secondary-container: '#b8b4b4'
  tertiary: '#e9c400'
  on-tertiary: '#3a3000'
  tertiary-container: '#c8a900'
  on-tertiary-container: '#4b3e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930005'
  secondary-fixed: '#e6e1e1'
  secondary-fixed-dim: '#c9c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#484646'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-glow: '#ff3b301a'
  glass-border: '#ffffff1a'
  rating-gold: '#FFD700'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-page: 40px
  stack-gap: 16px
  z-near: 20px
  z-mid: 0px
  z-far: -20px
---

## Brand & Style

This design system is a premium spatial interface that blends high-fidelity digital precision with cinematic depth. The brand personality is aggressive yet sophisticated, moving away from soft blues toward a high-energy, "Command Center" aesthetic. 

The visual style is **Glassmorphism** evolved for high-performance environments. It utilizes deep, dark surfaces with translucent properties, accented by "Vibrant Red" highlights that cut through the shadows. The emotional goal is to evoke a sense of power, focus, and cutting-edge technology, ensuring that the user feels immersed in a high-end, responsive digital ecosystem where the boundaries between hardware and software are seamless.

## Colors

The palette is optimized for OLED displays and spatial depth, centered on a high-contrast dark mode.

- **Primary Accent:** A premium Vibrant Red (`#ff3b30`) used for critical UI paths, active states, and focus indicators.
- **Surface Strategy:** Surfaces are not flat. They utilize "Rich Dark Gradients" moving from deep charcoal (`#1c1b1b`) to absolute black (`#0e0e0e`).
- **Subtle Glows:** Background layers should incorporate a very low-opacity red radial gradient (5-10%) to simulate light emission from the primary accent colors onto the glass surfaces.
- **Rating Gold:** A specific yellow/gold (`#FFD700`) is reserved exclusively for star ratings and achievement markers to ensure they remain distinct from the red-and-black brand hierarchy.

## Typography

This design system uses **Plus Jakarta Sans** across all levels to maintain a clean, geometric, and modern profile. 

In spatial environments, typography must fight background noise. All text should be rendered with a very subtle 10% black drop shadow to maintain legibility over the backdrop blurs. Use **Bold (700)** for primary headlines to give them a physical presence. Secondary metadata should use **Regular (400)** with a slight opacity reduction (70%) rather than a gray color to ensure it interacts naturally with the glass surfaces.

## Layout & Spacing

The layout utilizes a **Spatial Fluid Grid**. Elements are not just arranged on X and Y axes but are layered in Z-space to create a clear informational hierarchy.

- **Grid:** A 12-column system for desktop/spatial views with 24px gutters. The "Comfort Zone" dictates that primary content stays within the central 60% of the horizontal field.
- **Z-Axis Layering:** 
    - **Navigation:** Highest elevation (+20px).
    - **Main Content:** Ground plane (0px).
    - **Background Context:** Recessed plane (-20px).
- **Responsive Reflow:** On mobile devices, Z-axis depth is replaced by tonal stacking. Sidebars collapse into fixed bottom navigation bars to ensure one-handed accessibility.

## Elevation & Depth

Depth is conveyed through a combination of **Glassmorphism** and **Environmental Glows**.

1. **Material Tiers:** Surfaces use a "Rich Dark" glass. Base layers have a 30px blur with a charcoal-to-black gradient at 60% opacity. Focused or "near" layers increase blur to 50px.
2. **Edge Lighting:** Every glass panel must have a 1px top-left inner stroke (white, 15% opacity) to catch virtual light.
3. **Ambient Shadows:** Shadows are extra-diffused with large radii (80px+). To reinforce the brand, shadows for focused elements can have a faint red tint (`#ff3b30` at 5% opacity) instead of pure black.

## Shapes

The shape language balance precision with approachability. 

- **Windows & Containers:** Use `rounded-xl` (1.5rem) to create a soft, hardware-like silhouette for the main operating environment.
- **Secondary Items:** Cards and media thumbnails use `rounded-lg` (1rem).
- **Interactive Triggers:** Buttons, search bars, and focus rings are fully rounded (pill-shaped) to provide clear, "squishy" targets for gaze and gesture interaction.

## Components

- **Red Glass Buttons:** Primary actions use a semi-transparent red base (`#ff3b30` at 20% opacity) with a vibrant 1px red border. On hover, the opacity increases to 40%.
- **Rich Dark Cards:** Media cards feature a vertical gradient from `#1c1b1b` to `#0e0e0e`. A subtle red "inner glow" appears on the bottom edge when the card is in a focused state.
- **Rating Stars:** Stars are rendered in `#FFD700`. When active or filled, they should have a small golden outer glow to distinguish them from the red primary theme.
- **Inputs:** Pill-shaped fields with a 10% black fill and a 1px border that transitions from gray to Primary Red upon focus.
- **Glass Sidebar:** A vertical floating pane with high-intensity backdrop blur (50px). Active icons are indicated by a 4px red vertical bar on the left edge.
- **Segmented Controls:** These should look like physical cutouts in the glass, with the selected segment appearing as a raised red glass element.