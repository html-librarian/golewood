export default {
  title: 'Company details',
  updated: 'Effective as published on the website.',
  intro: "Golewood platform operator details. For contracts and invoices — golewood@internet.ru.",
  operatorTitle: 'Platform operator',
  bankTitle: 'Bank details',
  fields: {
    legalName: 'Legal name',
    inn: 'Tax ID (INN)',
    kpp: 'KPP',
    ogrn: 'OGRN',
    legalAddress: 'Registered address',
    email: 'Email',
    bankName: 'Bank',
    bankAccount: 'Account number',
    bik: 'BIK',
  },
  disclaimer: 'Verify details before issuing invoices. Replace demo values in the repository with your company data before production.',
} as const
