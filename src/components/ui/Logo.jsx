import styles from '@styles/ui/logo.module.css';

export function Logo({ variant = 'gold', size = 'default', showWordmark = true }) {
  const fill = variant === 'gold' ? '#C9A84C' : '#FFFFFF';

  return (
    <a href="/" className={`${styles.logo} ${styles[size]}`} aria-label="Remvo home">
      <svg
        className={styles.mark}
        viewBox="0 0 40 48"
        fill={fill}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
        <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
        <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
      </svg>
      {showWordmark && (
        <span className={styles.wordmark} style={{ color: fill }}>
          REMVO
        </span>
      )}
    </a>
  );
}
