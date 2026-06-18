import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import useStore from '../../store/useStore';

/**
 * Pointer Lock para rotación continua de cámara (solo desktop).
 *
 * ecctrl ya detecta `document.pointerLockElement` en su handler onDocumentMouseMove
 * y usa `e.movementX/e.movementY` (valores relativos) cuando está activo.
 * La limitación actual es que SIN pointer lock, movementX/Y deja de actualizarse
 * cuando el cursor llega al borde de la pantalla.
 *
 * En dispositivos táctiles este componente se desactiva completamente porque:
 * - ecctrl ya maneja rotación de cámara con touch (one finger rotate, two finger zoom)
 * - pointer lock interfiere con gestos táctiles nativos del navegador
 *
 * Este componente:
 * - Pide pointer lock en mousedown (botón izquierdo)
 * - Libera pointer lock en mouseup
 * - Previene el menú contextual en el canvas (right-click)
 * - Intercepta eventos basura (saltos bruscos) del mouse al salir del pointer lock
 * - Limpia todo al desmontar
 */
export default function PointerLock() {
  const { gl } = useThree();
  const isTransitioningLock = useRef(false);
  const cameraMode = useStore((s) => s.cameraMode);

  // Liberar el cursor automáticamente si salimos de tercera persona
  useEffect(() => {
    if (cameraMode !== 'thirdPerson' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [cameraMode]);

  useEffect(() => {
    // No activar pointer lock en dispositivos táctiles
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const canvas = gl.domElement;

    // Listener global en fase de CAPTURA para bloquear deltas gigantes generados por el navegador
    // al salir del pointer lock (cuando el cursor vuelve a su posición original)
    const handleMouseMoveCapture = (e) => {
      if (isTransitioningLock.current) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    };

    // Listener para detectar cambios en el estado del pointer lock
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        isTransitioningLock.current = true;
        // 50ms es suficiente para que el navegador procese el mousemove basura del reposicionamiento
        setTimeout(() => {
          isTransitioningLock.current = false;
        }, 50);
      }
    };

    document.addEventListener('mousemove', handleMouseMoveCapture, true);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseDown = (e) => {
      // Solo botón izquierdo (primary) y en modo tercera persona
      if (e.button !== 0 || useStore.getState().cameraMode !== 'thirdPerson') return;
      canvas.requestPointerLock();
    };

    const handleMouseUp = () => {
      if (document.pointerLockElement) {
        // Activamos el flag preventivamente en mouseup por si la reacción al pointerlockchange tarda
        isTransitioningLock.current = true;
        document.exitPointerLock();
        setTimeout(() => {
          isTransitioningLock.current = false;
        }, 50);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveCapture, true);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);

      // Safety: salir de pointer lock si sigue activo al desmontar
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [gl]);

  return null;
}
