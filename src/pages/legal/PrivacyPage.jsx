import { Link } from 'react-router';
import { LegalPageLayout, Clause, DefList, DefItem } from '@components/layout/marketing/LegalPageLayout';
import { BRAND, ROUTES, PRICING, LEGAL_UPDATED } from '@utils/constants';

const TOC = [
  { id: 'who', label: 'Who is responsible' },
  { id: 'collect', label: 'What we collect' },
  { id: 'why', label: 'Why we use it' },
  { id: 'share', label: 'Who we share it with' },
  { id: 'transfers', label: 'Where it is processed' },
  { id: 'keep', label: 'How long we keep it' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'rights', label: 'Your rights' },
  { id: 'security', label: 'Security' },
  { id: 'changes', label: 'Changes' },
];

export function PrivacyPage() {

  return (
    <LegalPageLayout
      title="Privacy Policy"
      date={LEGAL_UPDATED.label}
      dateTime={LEGAL_UPDATED.iso}
      version={LEGAL_UPDATED.version}
      tocItems={TOC}
      preamble={
        <>
          This policy says what {BRAND.NAME} collects about you, why, who else
          handles it, how long it is kept, and what you can ask us to do with
          it. We collect what the service needs to run and nothing more.
        </>
      }
    >
      <Clause id="who" heading="1. Who is responsible">
        <p>1.1. {BRAND.LEGAL_NAME}, RC {BRAND.RC_NUMBER}, {BRAND.ADDRESS}, is the controller of your personal data.</p>
        <p>1.2. Write to {BRAND.LEGAL_EMAIL} about anything in this policy.</p>
      </Clause>

      <Clause id="collect" heading="2. What we collect">
        <DefList>
          <DefItem term="Your account">Your email address, the date you joined, and a name if you give us one. Your password, only as a one-way hash (argon2id): we cannot read it, and nobody who saw our database could either. If you add a passkey, its public key and the kind of device it is on; the private part never leaves your device.</DefItem>
          <DefItem term="Your jobs">The barcodes and links you give us, and the listings we prepare from them.</DefItem>
          <DefItem term="Your purchases">From Polar: your name, email address, country, what you bought, the amount, any tax, and the order reference. We never see or store your card details.</DefItem>
          <DefItem term="Your credits">Every top-up, every job that used credits, every refund and every expiry.</DefItem>
          <DefItem term="Technical records">Your IP address, browser type, and the time of each request, kept in our server logs.</DefItem>
          <DefItem term="Welcome credits">When your account is made, a keyed hash of your IP address: a scrambled form that cannot be turned back into the address. It lets us give welcome credits once a day per connection.</DefItem>
          <DefItem term="Messages">What you send us in the chat or by email, the page you wrote from, and how you sell if you chose to tell us.</DefItem>
        </DefList>
      </Clause>

      <Clause id="why" heading="3. Why we use it">
        <p>3.1. To run the service you signed up for: to sign you in, run your jobs, keep your credit balance, and send receipts and expiry reminders. This is necessary to perform our contract with you.</p>
        <p>3.2. To keep the service secure and working, and to stop fraud and abuse. This is in our legitimate interest and yours.</p>
        <p>3.3. To keep the financial records tax law requires of us. This is a legal obligation.</p>
        <p>3.4. We do not use your data for advertising, we do not sell it, and we do not build a profile of you.</p>
        <p>3.5. To give welcome credits once: the hashed IP address in clause 2 stops one connection collecting them for many accounts. This is in our legitimate interest.</p>
      </Clause>

      <Clause id="share" heading="4. Who we share it with">
        <p>4.1. Only the companies that help us run the service, and only what each one needs:</p>
        <DefList>
          <DefItem term="Polar">Payments, receipts and tax, as our merchant of record.</DefItem>
          <DefItem term="Anthropic">Writes the listing text from the product details. Receives the product details, not your account.</DefItem>
          <DefItem term="Apify">Reads the product page for the barcode or link you give. Receives the barcode or link only.</DefItem>
          <DefItem term="eBay">Its public category and listing information, looked up by product. Receives no information about you.</DefItem>
          <DefItem term="Resend">Sends the codes that confirm your email and reset your password, receipts and reminders. Receives your email address.</DefItem>
          <DefItem term="Telegram">Brings chat messages to the person at Remvo who answers them. Receives your message, your email address and the page you wrote from.</DefItem>
          <DefItem term="Hostinger and Cloudflare">Host and protect our servers. Your data passes through them.</DefItem>
        </DefList>
        <p>4.2. We also disclose data where the law requires us to.</p>
      </Clause>

      <Clause id="transfers" heading="5. Where it is processed">
        <p>5.1. Several of the companies above process data outside Nigeria, the United Kingdom, the European Union and Canada, including in the United States. Where data leaves those places, it is protected by contract terms that require the receiving company to keep it to the same standard.</p>
      </Clause>

      <Clause id="keep" heading="6. How long we keep it">
        <DefList>
          <DefItem term="Jobs">{PRICING.RESULT_DAYS} days from the job, then deleted automatically. You can delete any job sooner, and it is gone straight away.</DefItem>
          <DefItem term="Your account">Until you close it, then 30 days, then deleted.</DefItem>
          <DefItem term="Purchases and credits">Six years from the end of the financial year they fall in, as tax law requires. These records hold amounts and dates, not your jobs.</DefItem>
          <DefItem term="Server logs">30 days.</DefItem>
          <DefItem term="Welcome credits">The hashed IP address: 30 days, then removed. That your account had welcome credits: as long as the account.</DefItem>
          <DefItem term="Messages">Two years from your last message.</DefItem>
        </DefList>
      </Clause>

      <Clause id="cookies" heading="7. Cookies">
        <p>7.1. We set one cookie, to keep you signed in. It is needed for the service to work, so we do not ask before setting it.</p>
        <p>7.2. We use no analytics, advertising or tracking cookies.</p>
      </Clause>

      <Clause id="rights" heading="8. Your rights">
        <p>8.1. You can ask us for a copy of your data, to correct it, to delete it, to send it to you in a file you can take elsewhere, or to stop using it for a purpose you object to.</p>
        <p>8.2. Write to {BRAND.LEGAL_EMAIL} from the email address on your account. We answer within 30 days.</p>
        <p>8.3. Deleting your data closes your account. We keep only the purchase records described in clause 6, because the law requires them.</p>
        <p>8.4. If you live in a US state with a consumer privacy law, such as California, you have the rights in 8.1, including to know what we hold and to have it deleted. We do not sell your personal information or share it for advertising, and we treat you the same whether or not you use these rights.</p>
        <p>8.5. You can complain to the data protection authority where you live: in Nigeria the Nigeria Data Protection Commission, in the United Kingdom the Information Commissioner&apos;s Office, in the European Union your national authority, in Canada the Office of the Privacy Commissioner, and in the United States your state attorney general. We would like the chance to put it right first.</p>
      </Clause>

      <Clause id="security" heading="9. Security">
        <p>9.1. Data travels encrypted between your browser and our servers. Access to it is limited to the people who run {BRAND.NAME}. If a breach puts your data at risk, we tell you and the authorities the law requires us to.</p>
        <p>9.2. After ten wrong passwords in a row, your account waits 15 minutes before it takes another; a reset code still works. Setting or resetting your password signs you out everywhere else.</p>
        <p>9.3. {BRAND.NAME} is not for anyone under 18, and we do not knowingly hold their data.</p>
      </Clause>

      <Clause id="changes" heading="10. Changes">
        <p>10.1. If we change this policy in a way that affects you, we email you before it takes effect. The date at the top shows when it last changed. See also our <Link to={ROUTES.TERMS}>terms of service</Link>.</p>
      </Clause>
    </LegalPageLayout>
  );
}
