import { useMemo } from 'react';
import useStore from '../../store/useStore';
import styles from './NavigationHUD.module.css';

export default function NavigationHUD() {
  const isNavigating = useStore((s) => s.isNavigating);
  const navigationTarget = useStore((s) => s.navigationTarget);
  const clearNavigation = useStore((s) => s.clearNavigation);
  const playerPosition = useStore((s) => s.playerPosition);
  const playerRotation = useStore((s) => s.playerRotation);

  // Calcular la distancia y el ángulo hacia el destino
  const navData = useMemo(() => {
    if (!isNavigating || !navigationTarget) return null;

    const dx = navigationTarget.x - playerPosition.x;
    const dz = navigationTarget.z - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Calcular el ángulo hacia el destino (en radianes) respecto al norte global (+Z o -Z dependiendo del sistema)
    // Three.js: Atan2(x, z) nos da el ángulo en Y
    const targetAngle = Math.atan2(dx, dz);
    
    // Diferencia entre la rotación actual del jugador y el ángulo del destino
    // Transformamos la rotación del jugador a un vector direccional para tener un ángulo local preciso
    // Para simplificar, calculamos la rotación relativa para la brújula 2D:
    const relativeAngle = targetAngle - playerRotation;
    
    // Convertir a grados
    const arrowRotationDeg = (relativeAngle * 180) / Math.PI;

    return {
      distance: distance.toFixed(0),
      arrowRotationDeg
    };
  }, [isNavigating, navigationTarget, playerPosition, playerRotation]);

  if (!isNavigating || !navData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.compassBox}>
        <div 
          className={styles.arrow} 
          style={{ transform: `rotate(${navData.arrowRotationDeg}deg)` }}
        >
          ▲
        </div>
      </div>
      
      <div className={styles.infoBox}>
        <span className={styles.targetName}>Hacia: {navigationTarget.name}</span>
        <span className={styles.distance}>{navData.distance}m</span>
      </div>

      <button className={styles.cancelBtn} onClick={clearNavigation}>
        ✕
      </button>
    </div>
  );
}
