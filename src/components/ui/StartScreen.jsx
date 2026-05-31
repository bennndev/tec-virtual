export default function StartScreen({ onStart }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
        fontFamily: 'ui-monospace, Consolas, monospace',
        color: '#fff',
      }}
    >
      {/* Línea decorativa superior */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: '#e94560',
          marginBottom: '32px',
        }}
      />

      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 700,
          letterSpacing: '2px',
          textAlign: 'center',
        }}
      >
        ¡Bienvenido a{' '}
        <span style={{ color: '#e94560' }}>Tec-Virtual</span>
        !
      </h1>

      <p
        style={{
          marginTop: '16px',
          fontSize: 'clamp(14px, 2vw, 18px)',
          opacity: 0.6,
          letterSpacing: '0.5px',
        }}
      >
        Explora el mundo virtual de la Tecnología
      </p>

      {/* Línea decorativa inferior */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: '#e94560',
          marginTop: '32px',
          marginBottom: '48px',
        }}
      />

      <button
        onClick={onStart}
        style={{
          padding: '14px 48px',
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'inherit',
          letterSpacing: '1px',
          color: '#fff',
          background: '#e94560',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(233, 69, 96, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        INICIAR
      </button>
    </div>
  );
}
