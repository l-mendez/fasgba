# 3D Chess Pawn Hero Section

## Summary

Replace the centered text hero with a split layout: text/CTAs left-aligned, a giant 3D chess pawn on the right. The pawn is a creamy wooden piece that rotates slowly on the Y-axis, starting tilted ~15°. The existing aurora background stays underneath.

## Layout

- **Desktop (lg+)**: Flex row — text left (~55%), 3D canvas right (~45%). Content vertically centered.
- **Tablet (md)**: Same split, pawn smaller.
- **Mobile (<md)**: Stacked — pawn above (reduced height ~200px, semi-transparent), text centered below.
- Hero section keeps `min-h-[85vh]`.

## 3D Pawn Component (`components/chess-pawn-3d.tsx`)

- Client component using `@react-three/fiber` and `@react-three/drei`.
- **Geometry**: Lathe geometry from a pawn profile curve (head sphere, neck, body taper, base).
- **Material**: `meshStandardMaterial` with creamy ivory color (`#F5E6C8`), roughness ~0.6, metalness ~0.1. Subtle warm tone.
- **Animation**: Continuous Y-axis rotation (~8s/revolution). Static X-axis tilt of ~15° (`-Math.PI / 12`).
- **Lighting**: Ambient light (warm, low intensity) + directional light from top-right.
- **Canvas**: Transparent background (`alpha: true`), no shadows for performance.
- **Performance**: Use `frameloop="always"`, keep geometry simple (low segment count on lathe).

## Changes to `app/page.tsx`

Hero section only — replace centered layout with flex split:
- Left side: title, subtitle, CTAs (left-aligned on desktop, centered on mobile).
- Right side: `<ChessPawn3D />` component.
- `HeroAurora` and bottom gradient fade unchanged.

## Dependencies

- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Utility helpers
- `three` — Three.js core (peer dep)

## Out of Scope

- All sections below the hero (news, tournaments, clubs, FAQ, footer)
- Aurora background animation changes
- Light/dark mode material changes (single material works for both)
