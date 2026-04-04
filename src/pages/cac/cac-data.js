/**
 * CAC Registration Data | Remvo Labs Limited
 *
 * INSTRUCTIONS:
 * 1. Replace every value marked [FILL] with your actual information
 * 2. Place signature images in public/temp/ as director-signature.png and witness-signature.png
 * 3. This file is imported by the /cac-registration page
 * 4. After CAC is complete, remove this route and file
 */

export const cacData = {
  // ═══════════════════════════════════════
  // COMPANY DETAILS (1-11)
  // ═══════════════════════════════════════
  companyNames: {
    primary: 'Remvo Labs Limited',
    secondary: 'Remvo Technologies Limited',
  },

  principalActivity: 'Information Technology and Digital Services',

  specificActivities: [
    'Development and operation of digital payment facilitation platforms',
    'Software development and technology consulting services',
    'Digital value card issuance and conversion routing services',
    'Application programming interface (API) development and licensing',
  ],

  companyEmail: 'hello@remvolabs.com', // [FILL] or keep this

  businessDescription:
    'Remvo Labs Limited is a technology company that develops and operates digital platforms for payment facilitation, currency conversion routing, and value card services. The company builds software products that enable businesses to accept local currency payments and settle in digital assets. The company also provides software development, API services, and technology consulting to businesses across Africa.',

  registeredAddress: {
    state: '[FILL]',
    localGovt: '[FILL]',
    city: '[FILL]',
    houseNumber: '[FILL]',
    streetName: '[FILL]',
  },

  articleOfAssociation: 'Standard Table A (default CAC template for LLC)',

  // ═══════════════════════════════════════
  // WITNESS (12-23)
  // ═══════════════════════════════════════
  witness: {
    fullName: '[FILL]',
    dateOfBirth: '[FILL]', // DD/MM/YYYY
    sex: '[FILL]',
    occupation: '[FILL]',
    phoneNumber: '[FILL]',
    email: '[FILL]',
    nationality: 'Nigerian',
    state: '[FILL]',
    localGovt: '[FILL]',
    town: '[FILL]',
    houseAddress: '[FILL]',
  },

  // ═══════════════════════════════════════
  // OBJECTIVE OF COMPANY (23)
  // ═══════════════════════════════════════
  companyObjective:
    'To carry on the business of information technology services including but not limited to: the development, operation, and maintenance of digital payment facilitation platforms and conversion routing services; the issuance and management of digital value cards; the provision of application programming interface (API) services to third-party platforms; software development, technology consulting, and digital infrastructure services; and to carry on any other business which may be conveniently carried on in connection with the above or which may enhance the value of the company\'s assets or rights.',

  // ═══════════════════════════════════════
  // SECRETARY (24-31)
  // ═══════════════════════════════════════
  secretary: {
    fullName: '[FILL]',
    dateOfBirth: '[FILL]', // DD/MM/YYYY
    sex: '[FILL]',
    occupation: '[FILL]',
    phoneNumber: '[FILL]',
    email: '[FILL]',
    address: '[FILL]',
    localGovt: '[FILL]',
    nin: '[FILL]',
  },

  // ═══════════════════════════════════════
  // DIRECTORS (32-39, 49-50)
  // ═══════════════════════════════════════
  directors: [
    {
      label: 'Director 1 (Primary)',
      fullName: '[FILL]',
      dateOfBirth: '[FILL]', // DD/MM/YYYY
      sex: '[FILL]',
      occupation: 'Software Developer / Entrepreneur',
      phoneNumber: '[FILL]',
      email: '[FILL]',
      address: '[FILL]',
      localGovt: '[FILL]',
      nin: '[FILL]',
      signatureFile: '/temp/director-1-signature.png',
    },
    {
      label: 'Director 2',
      fullName: '[FILL]',
      dateOfBirth: '[FILL]', // DD/MM/YYYY
      sex: '[FILL]',
      occupation: '[FILL]',
      phoneNumber: '[FILL]',
      email: '[FILL]',
      address: '[FILL]',
      localGovt: '[FILL]',
      nin: '[FILL]',
      signatureFile: '/temp/director-2-signature.png',
    },
  ],

  // ═══════════════════════════════════════
  // SHARE CAPITAL (40)
  // ═══════════════════════════════════════
  shareCapital: {
    totalIssued: '₦1,000,000',
    numberOfShares: '1,000,000',
    pricePerShare: '₦1.00',
  },

  // ═══════════════════════════════════════
  // SHAREHOLDER(S) (41-49)
  // ═══════════════════════════════════════
  shareholders: [
    {
      fullName: '[FILL]', // Director 1
      dateOfBirth: '[FILL]',
      sex: '[FILL]',
      occupation: 'Software Developer / Entrepreneur',
      phoneNumber: '[FILL]',
      email: '[FILL]',
      houseAddress: '[FILL]',
      localGovt: '[FILL]',
      nin: '[FILL]',
      sharesHeld: '900,000',
      percentage: '90%',
    },
    {
      fullName: '[FILL]', // Director 2
      dateOfBirth: '[FILL]',
      sex: '[FILL]',
      occupation: '[FILL]',
      phoneNumber: '[FILL]',
      email: '[FILL]',
      houseAddress: '[FILL]',
      localGovt: '[FILL]',
      nin: '[FILL]',
      sharesHeld: '100,000',
      percentage: '10%',
    },
  ],

  // ═══════════════════════════════════════
  // SIGNATURE FILES (50-51)
  // ═══════════════════════════════════════
  signatures: {
    director1: '/temp/director-1-signature.png',
    director2: '/temp/director-2-signature.png',
    witness: '/temp/witness-signature.png',
  },
};
