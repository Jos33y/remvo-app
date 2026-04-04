import { useEffect } from 'react';
import { Button } from '@components/ui/Button';
import { ROUTES } from '@utils/constants';
import styles from '@styles/pages/not-found.module.css';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Remvo | Page not found';
  }, []);

  return (
    <section className={styles.container}>
      {/* Background vault mark - brand watermark */}
      <svg
        className={styles.bgMark}
        viewBox="0 0 40 48"
        fill="#C9A84C"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polygon points="20,6 32,13 20,20 8,13" opacity="1" />
        <polygon points="20,12 32,19 20,26 8,19" opacity="0.55" />
        <polygon points="20,18 32,25 20,32 8,25" opacity="0.25" />
      </svg>

      {/* Background 404 number */}
      <span className={styles.bgCode} aria-hidden="true">404</span>

      {/* Content */}
      <div className={styles.content}>
        <h1 className={styles.heading}>This page does not exist.</h1>
        <p className={styles.body}>
          The URL you followed may be outdated or mistyped.
        </p>
        <Button href={ROUTES.PARTNERS} variant="primary">
          Go to platform overview
        </Button>
      </div>
    </section>
  );
}
