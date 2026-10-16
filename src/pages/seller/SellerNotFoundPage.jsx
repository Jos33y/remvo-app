import { useEffect } from 'react';
import { PageHeader } from '@components/ui/seller/PageHeader';
import { NotHere } from '@components/ui/seller/NotHere';
import s from '@styles/pages/seller/app.module.css';

/* An address that is not in Remvo. Inside the app (the tabs and the
 * sidebar stay), so the way on is one tap whatever the seller meant. */
export function SellerNotFoundPage() {
  useEffect(() => { document.title = 'Remvo | Page not found'; }, []);

  return (
    <>
      <PageHeader title="Not found" large={false} />
      <div className={s.content}>
        <NotHere heading="h2" title="No such address" text="This page is not in Remvo. The link may be old, or mistyped." />
      </div>
    </>
  );
}
