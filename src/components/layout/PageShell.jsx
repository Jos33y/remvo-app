import { Outlet } from 'react-router';
import { Header } from '@components/layout/Header';
import { Footer } from '@components/layout/Footer';
import { ScrollToTop } from '@components/layout/ScrollToTop';
import styles from '@styles/layout/page-shell.module.css';

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
