import useStore from '../../store/useStore';
import coinsData from '../../data/coins.json';
import ClayIcon from './ClayIcon';
import styles from './CoinCounter.module.css';

export default function CoinCounter() {
  const collectedCount = useStore((s) => s.collectedCoinIds.length);
  const total = coinsData.length;

  return (
    <div className={styles.counter} aria-label={`Monedas ${collectedCount} de ${total}`}>
      <ClayIcon name="monetization_on" className={styles.icon} />
      <span className={styles.value}>
        {collectedCount}
        <span className={styles.separator}>/</span>
        {total}
      </span>
    </div>
  );
}
