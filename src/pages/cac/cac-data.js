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
    'Remvo Labs Limited is a technology company that develops and operates digital platforms for payment processing, currency conversion services, and digital value card products. The company builds software products that enable businesses to accept payments and settle transactions across multiple channels. The company also provides software development, API services, and technology consulting to businesses across Africa.',

  registeredAddress: {
    state: 'Lagos',
    localGovt: 'Alimosho Local Government Area',
    city: 'Ipaja',
    houseNumber: '5',
    streetName: 'Funmilayo Awodiya close, Ige Estate',
  },

  articleOfAssociation: 'Standard Table A (default CAC template for LLC)',

  // ═══════════════════════════════════════
  // WITNESS (12-23)
  // ═══════════════════════════════════════
  witness: {
    fullName: 'Lagbalu Mary Anuoluwapo ',
    dateOfBirth: '06/11/2008', // DD/MM/YYYY
    sex: 'Female',
    occupation: 'Student',
    phoneNumber: '09026421370',
    email: 'anuoluwapolagbalu8@gmail.com',
    nationality: 'Nigerian',
    state: 'Lagos',
    localGovt: 'Ibeju-Lekki',
    town: 'Akodo',
    houseAddress: '20, Iwalesin Street, Egan Igando',
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
    fullName: 'Lagbalu Oreofe Benjamin',
    dateOfBirth: '22/11/2000', // DD/MM/YYYY
    sex: 'Male',
    occupation: 'Student',
    phoneNumber: '09133717780',
    email: 'oreofelagbalu@gmail.com',
    address: '20, Iwalesin Street, Egan Igando',
    localGovt: 'Ibeju-Lekki',
    nin: '56067080970',
  },

  // ═══════════════════════════════════════
  // DIRECTORS (32-39, 49-50)
  // ═══════════════════════════════════════
  directors: [
    {
      label: 'Director 1 (Primary)',
      fullName: 'Lagbalu Joseph Olorunfemi',
      dateOfBirth: '08/08/1999', // DD/MM/YYYY
      sex: 'Male',
      occupation: 'Software Developer / Entrepreneur',
      phoneNumber: '07037344408',
      email: 'hello@thebrickdev.com',
      address: '5, Funmilayo Awodiya close, Ige Estate, Lagos Nigeria',
      localGovt: 'Alimosho Local Government Area',
      nin: '90251065965',
      signatureFile: '/temp/director-1-signature.jpeg',
      ninFile: '/temp/director-1-nin.jpeg',
    },
    {
      label: 'Director 2',
      fullName: 'Lagbalu Abiodun Opeyemi ',
      dateOfBirth: '24/12/97', // DD/MM/YYYY
      sex: 'Female',
      occupation: 'Entrepreneur',
      phoneNumber: '09031333644',
      email: 'abiodunlagbalu@gmail.com ',
      address: '20, Iwalesin Street, Egan Igando',
      localGovt: 'Alimosho Local Government Area',
      nin: '84732225919',
      signatureFile: '/temp/director-2-signature.jpeg',
      ninFile: '/temp/director-2-nin.jpeg',
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
      fullName: 'Lagbalu Joseph Olorunfemi',
      dateOfBirth: '08/08/1999', // DD/MM/YYYY
      sex: 'Male',
      occupation: 'Software Developer / Entrepreneur',
      phoneNumber: '07037344408',
      email: 'hello@thebrickdev.com',
      houseAddress: '5, Funmilayo Awodiya close, Ige Estate, Lagos Nigeria',
      localGovt: 'Alimosho Local Government Area',
      nin: '90251065965',
      sharesHeld: '900,000',
      percentage: '90%',
    },
    {
      fullName: 'Lagbalu Abiodun Opeyemi ',
      dateOfBirth: '24/12/97', // DD/MM/YYYY
      sex: 'Female',
      occupation: 'Entrepreneur',
      phoneNumber: '09031333644',
      email: 'abiodunlagbalu@gmail.com ',
      houseAddress: '20, Iwalesin Street, Egan Igando',
      localGovt: 'Alimosho Local Government Area',
      nin: '84732225919',
      sharesHeld: '100,000',
      percentage: '10%',
    },
  ],

  // ═══════════════════════════════════════
  // SIGNATURE FILES (50-51)
  // ═══════════════════════════════════════
  signatures: {
    director1: '/temp/director-1-signature.jpeg',
    director2: '/temp/director-2-signature.jpeg',
    witness: '/temp/witness-signature.jpeg',
  },

  // ═══════════════════════════════════════
  // NIN IMAGES (for director KYC)
  // ═══════════════════════════════════════
  ninImages: {
    director1: '/temp/director-1-nin.jpeg',
    director2: '/temp/director-2-nin.jpeg',
  },
};