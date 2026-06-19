import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './VideoModal.module.css';

export default function VideoModal() {
  const tvVideoUrl = useStore((s) => s.tvVideoUrl);
  const setTvVideoUrl = useStore((s) => s.setTvVideoUrl);

  if (!tvVideoUrl) return null;

  // Extraer ID del video de YouTube para el embed
  const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYoutubeId(tvVideoUrl);
  const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : null;

  const handleClose = () => {
    setTvVideoUrl(null);
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>▶ Video Informativo</span>
          <ClayButton className={styles.closeBtn} onClick={handleClose} title="Cerrar">
            ✕
          </ClayButton>
        </div>
        <div className={styles.videoContainer}>
          {embedUrl ? (
            <iframe
              className={styles.iframe}
              src={embedUrl}
              title="Video informativo"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className={styles.error}>
              No se pudo cargar el video. URL inválida.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
