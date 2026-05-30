import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Pointer Lock para rotación continua de cámara.
 *
 * ecctrl ya detecta `document.pointerLockElement` en su handler onDocumentMouseMove
 * y usa `e.movementX/e.movementY` (valores relativos) cuando está activo.
 * La limitación actual es que SIN pointer lock, movementX/Y deja de actualizarse
 * cuando el cursor llega al borde de la pantalla.
 *
 * Este componente:
 * - Pide pointer lock en mousedown (botón izquierdo)
 * - Libera pointer lock en mouseup
 * - Previene el menú contextual en el canvas (right-click)
 * - Limpia todo al desmontar
 */
export default function PointerLock() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e) => {
      // Solo botón izquierdo (primary)
      if (e.button !== 0) return;
      canvas.requestPointerLock();
    };

    const handleMouseUp = () => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
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
