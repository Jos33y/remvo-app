import { Outlet } from 'react-router';
import { Header } from '@components/layout/marketing/Header';
import { Footer } from '@components/layout/marketing/Footer';
import { ScrollToTop } from '@components/layout/shared/ScrollToTop';
import styles from '@styles/layout/marketing/page-shell.module.css';

export function PageShell() {
  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
