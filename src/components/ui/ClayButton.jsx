import React from 'react';

/**
 * ClayButton — Componente reutilizable con estética Claymorphism.
 *
 * Props:
 *   variant   — "cyan-solid" | "cyan-light" | "translucent" (por defecto)
 *   className — clases CSS adicionales para maquetación o posicionamiento (opcional)
 *   onClick   — manejador de clicks (opcional)
 *   children  — contenido a renderizar dentro del botón
 *   ...rest   — atributos nativos de button (title, type, disabled, etc.)
 */
export default function ClayButton({
  variant = 'translucent',
  className = '',
  onClick,
  children,
  ...rest
}) {
  const variantClass = variant !== 'translucent' ? `clay-${variant}` : '';

  return (
    <button
      onClick={onClick}
      className={`clay-btn ${variantClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
