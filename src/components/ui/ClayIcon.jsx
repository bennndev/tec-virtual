/**
 * ClayIcon — Componente puramente presentacional.
 *
 * Renderiza un ícono Material Symbol Rounded.
 * Cero estilos propios — las clases claymorphism las aplica
 * el componente que lo compone via className.
 *
 * Props:
 *   name      — nombre del ícono (ej: "info", "favorite", "settings")
 *   className — clases CSS adicionales (opcional)
 *
 * Sin dependencias, sin estado, sin efectos.
 */
export default function ClayIcon({ name, className = '' }) {
  return (
    <span
      className={`material-symbols-rounded ${className}`.trim()}
      style={{
        fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
      }}
    >
      {name}
    </span>
  );
}
