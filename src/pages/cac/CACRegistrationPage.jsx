import { useEffect } from 'react';
import { cacData } from './cac-data';
import styles from '@styles/pages/cac.module.css';

function Field({ label, value, number, sensitive = false }) {
  const isEmpty = !value || value === '[FILL]';

  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        {number && <span className={styles.fieldNumber}>{number}</span>}
        <span className={styles.fieldLabel}>{label}</span>
      </div>
      <div className={`${styles.fieldValue} ${isEmpty ? styles.empty : ''} ${sensitive ? styles.sensitive : ''}`}>
        {isEmpty ? 'To be filled' : value}
      </div>
    </div>
  );
}

function DownloadButton({ filePath, fileName }) {
  return (
    <a
      href={filePath}
      download={fileName}
      className={styles.downloadBtn}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M8 1v10m0 0L4.5 7.5M8 11l3.5-3.5M2 13.5h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Download
    </a>
  );
}

function SectionHeader({ title, range }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {range && <span className={styles.sectionRange}>Items {range}</span>}
    </div>
  );
}

export function CACRegistrationPage() {
  const d = cacData;

  useEffect(() => {
    document.title = 'CAC Registration | Remvo Labs Limited';
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <span className={styles.badge}>Internal | CAC Registration</span>
          <h1 className={styles.pageTitle}>Remvo Labs Limited</h1>
          <p className={styles.pageSub}>
            Limited Liability Company registration data. All fields below are
            required for CAC filing.
          </p>
        </div>
      </div>

      <div className={styles.pageBody}>
        <div className={styles.pageBodyInner}>

      {/* ── COMPANY DETAILS ── */}
      <section className={styles.section}>
        <SectionHeader title="Company details" range="1-11" />
        <div className={styles.fieldGroup}>
          <Field number="1a" label="Company name (primary)" value={d.companyNames.primary} />
          <Field number="1b" label="Company name (secondary)" value={d.companyNames.secondary} />
          <Field number="2" label="Principal activity" value={d.principalActivity} />
          <Field number="3" label="Specific activities" value={d.specificActivities.join('; ')} />
          <Field number="4" label="Company email" value={d.companyEmail} />
          <Field number="5" label="Full description of business activity" value={d.businessDescription} />
          <Field number="6" label="State" value={d.registeredAddress.state} />
          <Field number="7" label="Local government" value={d.registeredAddress.localGovt} />
          <Field number="8" label="City / Town" value={d.registeredAddress.city} />
          <Field number="9" label="House number" value={d.registeredAddress.houseNumber} />
          <Field number="10" label="Street name" value={d.registeredAddress.streetName} />
          <Field number="11" label="Article of association" value={d.articleOfAssociation} />
        </div>
      </section>

      {/* ── WITNESS ── */}
      <section className={styles.section}>
        <SectionHeader title="Witness" range="12-22" />
        <div className={styles.fieldGroup}>
          <Field number="12" label="Full name" value={d.witness.fullName} />
          <Field number="13" label="Date of birth" value={d.witness.dateOfBirth} sensitive />
          <Field number="14" label="Sex" value={d.witness.sex} />
          <Field number="15" label="Occupation" value={d.witness.occupation} />
          <Field number="16" label="Phone number" value={d.witness.phoneNumber} sensitive />
          <Field number="17" label="Email address" value={d.witness.email} />
          <Field number="18" label="Nationality" value={d.witness.nationality} />
          <Field number="19" label="State" value={d.witness.state} />
          <Field number="20" label="Local government" value={d.witness.localGovt} />
          <Field number="21" label="Town" value={d.witness.town} />
          <Field number="22" label="House address" value={d.witness.houseAddress} />
        </div>
      </section>

      {/* ── COMPANY OBJECTIVE ── */}
      <section className={styles.section}>
        <SectionHeader title="Company objective" range="23" />
        <div className={styles.fieldGroup}>
          <Field number="23" label="Objective of company" value={d.companyObjective} />
        </div>
      </section>

      {/* ── SECRETARY ── */}
      <section className={styles.section}>
        <SectionHeader title="Company secretary" range="24-31" />
        <div className={styles.fieldGroup}>
          <Field number="24" label="Full name" value={d.secretary.fullName} />
          <Field number="25" label="Date of birth" value={d.secretary.dateOfBirth} sensitive />
          <Field number="26" label="Sex" value={d.secretary.sex} />
          <Field number="27" label="Occupation" value={d.secretary.occupation} />
          <Field number="28" label="Phone number" value={d.secretary.phoneNumber} sensitive />
          <Field number="29" label="Email address" value={d.secretary.email} />
          <Field number="30" label="Address and local government" value={`${d.secretary.address}, ${d.secretary.localGovt}`} />
          <Field number="31" label="NIN" value={d.secretary.nin} sensitive />
        </div>
      </section>

      {/* ── DIRECTORS ── */}
      <section className={styles.section}>
        <SectionHeader title="Directors" range="32-39, 49" />
        {d.directors.map((dir, i) => (
          <div key={i} className={styles.fieldGroup}>
            <div className={styles.shareholderLabel}>{dir.label}</div>
            <Field number="32" label="Full name" value={dir.fullName} />
            <Field number="33" label="Date of birth" value={dir.dateOfBirth} sensitive />
            <Field number="34" label="Sex" value={dir.sex} />
            <Field number="35" label="Occupation" value={dir.occupation} />
            <Field number="36" label="Phone number" value={dir.phoneNumber} sensitive />
            <Field number="37" label="Email address" value={dir.email} />
            <Field number="38" label="Address and local government" value={`${dir.address}, ${dir.localGovt}`} />
            <Field number="39/49" label="NIN" value={dir.nin} sensitive />
          </div>
        ))}
      </section>

      {/* ── SHARE CAPITAL ── */}
      <section className={styles.section}>
        <SectionHeader title="Share capital" range="40" />
        <div className={styles.fieldGroup}>
          <Field number="40a" label="Total issued share capital" value={d.shareCapital.totalIssued} />
          <Field number="40b" label="Number of shares" value={d.shareCapital.numberOfShares} />
          <Field number="40c" label="Price per share" value={d.shareCapital.pricePerShare} />
        </div>
      </section>

      {/* ── SHAREHOLDERS ── */}
      <section className={styles.section}>
        <SectionHeader title="Shareholder(s)" range="41-48" />
        {d.shareholders.map((sh, i) => (
          <div key={i} className={styles.fieldGroup}>
            {d.shareholders.length > 1 && (
              <div className={styles.shareholderLabel}>Shareholder {i + 1}</div>
            )}
            <Field number="41" label="Full name" value={sh.fullName} />
            <Field number="42" label="Date of birth" value={sh.dateOfBirth} sensitive />
            <Field number="43" label="Sex" value={sh.sex} />
            <Field number="44" label="Occupation" value={sh.occupation} />
            <Field number="45" label="Phone number" value={sh.phoneNumber} sensitive />
            <Field number="46" label="Email address" value={sh.email} />
            <Field number="47" label="House address and local government" value={`${sh.houseAddress}, ${sh.localGovt}`} />
            <Field number="48" label="NIN" value={sh.nin} sensitive />
            <Field label="Shares held" value={`${sh.sharesHeld} (${sh.percentage})`} />
          </div>
        ))}
      </section>

      {/* ── SIGNATURES ── */}
      <section className={styles.section}>
        <SectionHeader title="Signatures" range="50-51" />
        <div className={styles.signatureGrid}>
          <div className={styles.signatureCard}>
            <span className={styles.signatureLabel}>50a. Director 1 signature</span>
            <div className={styles.signaturePreview}>
              <img
                src={d.signatures.director1}
                alt="Director 1 signature"
                className={styles.signatureImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className={styles.signaturePlaceholder} style={{ display: 'none' }}>
                Place director-1-signature.png in public/temp/
              </span>
            </div>
            <DownloadButton
              filePath={d.signatures.director1}
              fileName="director-1-signature.png"
            />
          </div>
          <div className={styles.signatureCard}>
            <span className={styles.signatureLabel}>50b. Director 2 signature</span>
            <div className={styles.signaturePreview}>
              <img
                src={d.signatures.director2}
                alt="Director 2 signature"
                className={styles.signatureImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className={styles.signaturePlaceholder} style={{ display: 'none' }}>
                Place director-2-signature.png in public/temp/
              </span>
            </div>
            <DownloadButton
              filePath={d.signatures.director2}
              fileName="director-2-signature.png"
            />
          </div>
          <div className={styles.signatureCard}>
            <span className={styles.signatureLabel}>51. Witness signature</span>
            <div className={styles.signaturePreview}>
              <img
                src={d.signatures.witness}
                alt="Witness signature"
                className={styles.signatureImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className={styles.signaturePlaceholder} style={{ display: 'none' }}>
                Place witness-signature.png in public/temp/
              </span>
            </div>
            <DownloadButton
              filePath={d.signatures.witness}
              fileName="witness-signature.png"
            />
          </div>
        </div>
      </section>

        </div>
      </div>

      <div className={styles.pageFooter}>
        <div className={styles.pageFooterInner}>
          <p>
            This page is temporary and will be removed after CAC registration is
            complete. Do not share this link publicly.
          </p>
        </div>
      </div>
    </div>
  );
}
