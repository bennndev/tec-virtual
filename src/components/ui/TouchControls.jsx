import { useState, useMemo, useEffect } from 'react';
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
 *   - Izquierda arriba: Botón de salto
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

  // Viewport width para posicionar el botón de salto a la izquierda
  // (EcctrlJoystick solo expone buttonPositionRight, no left)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isTouchDevice) return null;

  // Calcular right para posicionar el botón en la izquierda:
  // buttonRight = viewportWidth - buttonWidth - leftMargin
  const BTN_SIZE = 110;
  const LEFT_MARGIN = 16;
  const buttonPositionRight = viewport.width - BTN_SIZE - LEFT_MARGIN;

  return (
    <EcctrlJoystick
      buttonNumber={1}
      /* ── Joystick: tamaño y posición ── */
      joystickHeightAndWidth={150}
      joystickPositionLeft={16}
      joystickPositionBottom={16}
      /* ── Botón de salto: junto al joystick en la izquierda ── */
      buttonHeightAndWidth={BTN_SIZE}
      buttonPositionRight={buttonPositionRight}
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
