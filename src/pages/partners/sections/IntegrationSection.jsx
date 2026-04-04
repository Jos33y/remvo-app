import { Reveal } from '@components/ui/Reveal';
import styles from '@styles/pages/partners.module.css';

function Code({ children }) {
  return <code>{children}</code>;
}

function C({ children }) { return <span className={styles.codeComment}>{children}</span>; }
function K({ children }) { return <span className={styles.codeKeyword}>{children}</span>; }
function S({ children }) { return <span className={styles.codeString}>{children}</span>; }
function P({ children }) { return <span className={styles.codeProperty}>{children}</span>; }
function X({ children }) { return <span className={styles.codePunctuation}>{children}</span>; }
function F({ children }) { return <span className={styles.codeFunction}>{children}</span>; }
function T({ children }) { return <span className={styles.codePlain}>{children}</span>; }

export function IntegrationSection() {
  return (
    <section className={styles.sectionDark} aria-labelledby="integration-heading">
      <div className={styles.sectionInner}>
        <Reveal>
          <div className={styles.sectionLabelLight}>Integration</div>
          <h2 id="integration-heading" className={styles.sectionHeadingLight}>
            One API call. One webhook.
          </h2>
          <p className={styles.sectionBodyLight}>
            Server-side initialization, like Paystack or Stripe. Your backend
            creates a session, redirects the user. When they pay, you receive
            a webhook.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className={styles.codeGrid}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeTitle}>initialize.js</span>
              </div>
              <pre className={styles.codePre}>
                <Code>
{<K>const</K>} <T>res</T> <X>=</X> <K>await</K> <F>fetch</F><X>(</X>{'\n'}
{'  '}<S>'https://api.remvo.app/v1/checkout/initialize'</S><X>,</X>{'\n'}
{'  '}<X>{'{'}</X>{'\n'}
{'    '}<P>method</P><X>:</X> <S>'POST'</S><X>,</X>{'\n'}
{'    '}<P>headers</P><X>:</X> <X>{'{'}</X>{'\n'}
{'      '}<S>'Authorization'</S><X>:</X> <S>'Bearer YOUR_KEY'</S><X>,</X>{'\n'}
{'      '}<S>'Content-Type'</S><X>:</X> <S>'application/json'</S><X>,</X>{'\n'}
{'    '}<X>{'}'}</X><X>,</X>{'\n'}
{'    '}<P>body</P><X>:</X> <T>JSON</T><X>.</X><F>stringify</F><X>(</X><X>{'{'}</X>{'\n'}
{'      '}<P>platform_id</P><X>:</X> <S>'your_platform'</S><X>,</X>{'\n'}
{'      '}<P>user_id</P><X>:</X> <S>'user_456'</S><X>,</X>{'\n'}
{'      '}<P>amount_usd</P><X>:</X> <T>25</T><X>,</X>{'\n'}
{'      '}<P>callback_url</P><X>:</X> <S>'https://yoursite.com/done'</S><X>,</X>{'\n'}
{'    '}<X>{'}'}</X><X>)</X><X>,</X>{'\n'}
{'  '}<X>{'}'}</X>{'\n'}
<X>)</X><X>;</X>{'\n'}
{'\n'}
<K>const</K> <X>{'{'}</X> <T>checkout_url</T> <X>{'}'}</X> <X>=</X> <K>await</K> <T>res</T><X>.</X><F>json</F><X>()</X><X>;</X>{'\n'}
<C>// Redirect user to checkout_url</C>
                </Code>
              </pre>
            </div>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeDot} aria-hidden="true" />
                <span className={styles.codeTitle}>webhook.js</span>
              </div>
              <pre className={styles.codePre}>
                <Code>
<T>app</T><X>.</X><F>post</F><X>(</X><S>'/api/remvo-webhook'</S><X>,</X> <X>(</X><T>req</T><X>,</X> <T>res</T><X>)</X> <X>=&gt;</X> <X>{'{'}</X>{'\n'}
{'  '}<K>const</K> <X>{'{'}</X>{'\n'}
{'    '}<T>event</T><X>,</X>{'\n'}
{'    '}<T>user_id</T><X>,</X>{'\n'}
{'    '}<T>usdt_credited</T><X>,</X>{'\n'}
{'    '}<T>reference</T><X>,</X>{'\n'}
{'  '}<X>{'}'}</X> <X>=</X> <T>req</T><X>.</X><P>body</P><X>;</X>{'\n'}
{'\n'}
{'  '}<K>if</K> <X>(</X><T>event</T> <X>===</X> <S>'deposit.confirmed'</S><X>)</X> <X>{'{'}</X>{'\n'}
{'    '}<F>creditUserBalance</F><X>(</X><T>user_id</T><X>,</X> <T>usdt_credited</T><X>)</X><X>;</X>{'\n'}
{'  '}<X>{'}'}</X>{'\n'}
{'\n'}
{'  '}<T>res</T><X>.</X><F>status</F><X>(</X><T>200</T><X>)</X><X>.</X><F>send</F><X>(</X><S>'OK'</S><X>)</X><X>;</X>{'\n'}
<X>{'}'}</X><X>)</X><X>;</X>
                </Code>
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
