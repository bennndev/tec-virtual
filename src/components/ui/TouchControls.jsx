import { useState, useMemo } from 'react';
import { EcctrlJoystick } from 'ecctrl';
import * as THREE from 'three';

/**
 * TouchControls — Joystick táctil + botones para mobile.
 *
 * Solo se renderiza en dispositivos con soporte táctil.
 * Diseño transparente para no opacar la visibilidad del escenario.
 *
 * Layout:
 *   - Izquierda abajo: Joystick de movimiento (caminar/correr)
 *   - Derecha abajo: Botón de salto
 *
 * El joystick detecta automáticamente la carrera cuando se empuja
 * más allá del umbral (joystickRunSensitivity), sin necesidad de
 * botón adicional de sprint.
 */
export default function TouchControls() {
  const [isTouchDevice] = useState(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
  );

  const transparentWhite = useMemo(
    () => (opacity) =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    []
  );

  if (!isTouchDevice) return null;

  return (
    <EcctrlJoystick
      buttonNumber={1}
      /* ── Joystick: tamaño y posición ── */
      joystickHeightAndWidth={150}
      joystickPositionLeft={16}
      joystickPositionBottom={16}
      /* ── Botón de salto: en la derecha ── */
      buttonHeightAndWidth={100}
      buttonPositionRight={16}
      buttonPositionBottom={180}
      /* ── Materiales del joystick (transparentes) ── */
      joystickBaseProps={{
        material: transparentWhite(0.08),
      }}
      joystickStickProps={{
        material: transparentWhite(0.12),
      }}
      joystickHandleProps={{
        material: transparentWhite(0.2),
      }}
      /* ── Materiales del botón de salto (transparentes) ── */
      buttonLargeBaseProps={{
        material: transparentWhite(0.08),
      }}
      buttonTop1Props={{
        material: transparentWhite(0.15),
      }}
      /* ── Sensibilidad de carrera ── */
      joystickRunSensitivity={0.85}
    />
  );
}
