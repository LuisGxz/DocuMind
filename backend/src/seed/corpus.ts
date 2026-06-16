/**
 * Realistic legal corpus for the "Legal & Contracts" demo workspace.
 * Each document is authored as an array of pages; the seed joins them with a
 * form-feed (\f) so the text extractor produces page-accurate citations.
 * Content is fictional but written like real contract language so RAG answers
 * (and the mockup's sample Q&A about termination & data) are genuinely grounded.
 */
export interface SeedDocument {
  filename: string;
  mimeType: string;
  pages: string[];
}

export const SEED_CORPUS: SeedDocument[] = [
  {
    filename: 'master-services-agreement-2026.pdf',
    mimeType: 'text/plain',
    pages: [
      `MASTER SERVICES AGREEMENT
Helios Cloud Inc. — Customer Agreement
Effective Date: January 1, 2026

Section 1 — Definitions
1.1 "Agreement" means this Master Services Agreement together with all Order Forms, Statements of Work, and exhibits incorporated by reference.
1.2 "Services" means the cloud hosting, compute, and managed database services described in the applicable Order Form.
1.3 "Customer Data" means all electronic data or information submitted by Customer to the Services.
1.4 "Service Fees" means the recurring and usage-based charges set out in the Order Form.`,
      `Section 2 — Provision of Services
2.1 Provider will make the Services available to Customer pursuant to this Agreement and the applicable Order Form during the Subscription Term.
2.2 Provider will use commercially reasonable efforts to make the Services available 24 hours a day, 7 days a week, except for planned maintenance and force majeure events.
2.3 Provider will provide the Services in accordance with the Service Level Agreement attached as Exhibit A.

Section 3 — Fees and Payment
3.1 Customer will pay all Service Fees specified in each Order Form. Fees are based on Services purchased and not on actual usage unless an Order Form states otherwise.
3.2 Invoices are due net thirty (30) days from the invoice date. Overdue amounts accrue interest at 1.5% per month.`,
      `Section 4 — Confidentiality
4.1 Each party may disclose Confidential Information to the other. The receiving party will protect Confidential Information using the same degree of care it uses for its own confidential information, but no less than reasonable care.
4.2 Confidentiality obligations survive termination of this Agreement for a period of three (3) years, except for trade secrets, which are protected for as long as they remain trade secrets under applicable law.

Section 5 — Data Protection
5.1 Provider processes Customer Data only to provide the Services and in accordance with the Data Processing Agreement (Exhibit B).
5.2 Provider maintains administrative, physical, and technical safeguards designed to protect the security and integrity of Customer Data.`,
      `Section 6 — Warranties and Disclaimers
6.1 Each party warrants that it has the legal power to enter into this Agreement.
6.2 EXCEPT AS EXPRESSLY PROVIDED, THE SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.

Section 7 — Limitation of Liability
7.1 Neither party's aggregate liability arising out of this Agreement will exceed the total Service Fees paid by Customer in the twelve (12) months preceding the claim.
7.2 Neither party is liable for indirect, incidental, or consequential damages.

Section 8 — Indemnification
8.1 Provider will defend Customer against third-party claims that the Services infringe intellectual property rights, and will indemnify Customer for resulting costs finally awarded.`,
      `Section 9 — Termination
9.1 Termination for convenience. Either party may terminate this Agreement upon ninety (90) days' prior written notice to the other party, provided that all outstanding Service Fees become due upon the effective date of termination.
9.2 Termination for cause. Either party may terminate immediately if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days of receiving written notice describing the breach in reasonable detail.
9.3 Effect of termination. Upon termination, Customer shall retain access to exported data for a period of sixty (60) days, after which Provider may delete Customer Data in accordance with Section 11. Provider will, upon request during that window, provide Customer Data in a standard machine-readable format.`,
      `Section 10 — Suspension
10.1 Provider may suspend the Services if Customer's account is more than thirty (30) days overdue, or if continued use poses a security risk to the Services or other customers.
10.2 Provider will give reasonable advance notice of suspension where practicable.

Section 11 — Data Retention and Deletion
11.1 Following the sixty (60) day export window described in Section 9.3, Provider will delete or anonymize Customer Data within thirty (30) days, except where retention is required by law.
11.2 Provider will certify deletion in writing upon Customer's request.

Section 12 — Governing Law
12.1 This Agreement is governed by the laws of the State of Delaware, without regard to conflict-of-laws principles.

Master Services Agreement · Helios Cloud Inc.`,
    ],
  },
  {
    filename: 'vendor-dpa-helios-2026.pdf',
    mimeType: 'text/plain',
    pages: [
      `DATA PROCESSING AGREEMENT (Exhibit B)
Between Customer (Controller) and Helios Cloud Inc. (Processor)

Section 1 — Subject Matter
1.1 This Data Processing Agreement governs the Processor's processing of Personal Data on behalf of the Controller in connection with the Services.
1.2 Capitalized terms not defined here have the meaning given in the GDPR or the Master Services Agreement.

Section 2 — Scope of Processing
2.1 The Processor processes Personal Data only on documented instructions from the Controller, including with regard to international transfers.
2.2 The categories of data subjects and Personal Data are described in Annex I.`,
      `Section 3 — Sub-processors
3.1 The Controller authorizes the Processor to engage sub-processors listed in Annex II.
3.2 The Processor will inform the Controller of any intended changes concerning the addition or replacement of sub-processors at least thirty (30) days in advance, giving the Controller the opportunity to object.

Section 4 — Security Measures
4.1 The Processor implements encryption of Personal Data in transit and at rest using industry-standard algorithms.
4.2 The Processor maintains access controls, logging, and regular penetration testing.
4.3 Documents are processed in encrypted form and Customer Data is never used to train machine-learning models.`,
      `Section 5 — Data Subject Rights
5.1 The Processor assists the Controller, by appropriate technical and organizational measures, in responding to requests to exercise data subject rights (access, rectification, erasure, portability).

Section 6 — Personal Data Breach
6.1 The Processor notifies the Controller without undue delay, and in any event within seventy-two (72) hours, after becoming aware of a Personal Data breach.

Section 7 — Deletion and Return
7.1 Upon termination of the Services, the Processor deletes or returns all Personal Data within sixty (60) days, consistent with Section 9.3 of the Master Services Agreement, unless retention is required by law.`,
    ],
  },
  {
    filename: 'mutual-nda-2026.pdf',
    mimeType: 'text/plain',
    pages: [
      `MUTUAL NON-DISCLOSURE AGREEMENT
Between the Parties identified in the signature block.
Effective Date: as of the date of last signature.

1. Purpose. The parties wish to explore a potential business relationship and may disclose confidential information to each other for that purpose (the "Purpose").

2. Confidential Information. "Confidential Information" means any non-public information disclosed by one party (the "Discloser") to the other (the "Recipient"), whether oral, written, or electronic, that is designated confidential or that reasonably should be understood to be confidential.`,
      `3. Obligations. The Recipient will (a) use Confidential Information solely for the Purpose, (b) protect it with at least reasonable care, and (c) not disclose it to third parties except to employees and advisors with a need to know who are bound by confidentiality obligations.

4. Exclusions. Confidential Information does not include information that is or becomes public through no fault of the Recipient, was rightfully known before disclosure, or is independently developed without use of the Confidential Information.

5. Term. The obligations in this Agreement survive for two (2) years from the date of disclosure. Trade secrets remain protected for as long as they qualify as trade secrets.

6. Return of Materials. Upon written request, the Recipient will return or destroy all Confidential Information and certify such destruction.`,
    ],
  },
  {
    filename: 'saas-subscription-terms-v2.pdf',
    mimeType: 'text/plain',
    pages: [
      `SAAS SUBSCRIPTION TERMS (v2)
These terms govern Customer's subscription to the software-as-a-service product.

1. Subscription Term. The initial term is twelve (12) months beginning on the Order Form start date.

2. Automatic Renewal. This subscription renews automatically for successive twelve (12) month periods unless either party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term. Renewal pricing may increase by no more than seven percent (7%) over the prior term.`,
      `3. Usage Limits. The subscription includes the seat count and usage tier specified in the Order Form. Overages are billed monthly at the then-current overage rate.

4. Support. Standard support is included with a target response time of one (1) business day. Premium support is available for an additional fee.

5. Service Credits. If monthly uptime falls below 99.9%, Customer is eligible for service credits as set out in the Service Level Agreement.

6. Termination. Customer may terminate for convenience effective at the end of the current term by providing the non-renewal notice described in Section 2. Fees already paid are non-refundable except as required by law.`,
    ],
  },
  {
    filename: 'ip-assignment-acme.pdf',
    mimeType: 'text/plain',
    pages: [
      `INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT
Between Acme Holdings ("Assignor") and the Company ("Assignee").

1. Assignment. Assignor hereby irrevocably assigns to Assignee all right, title, and interest in and to the Work Product, including all intellectual property rights therein.

2. Work Product. "Work Product" means all inventions, works of authorship, designs, and know-how created by Assignor in connection with the Services.

3. Moral Rights. To the extent permitted by law, Assignor waives any moral rights in the Work Product.

4. Further Assurances. Assignor will execute any documents reasonably necessary to perfect Assignee's ownership, including patent and copyright assignments.`,
    ],
  },
  {
    filename: 'employment-offer-template-2026.docx',
    mimeType: 'text/plain',
    pages: [
      `EMPLOYMENT OFFER LETTER (Template)

Dear [Candidate],
We are pleased to offer you the position of [Title], reporting to [Manager].

1. Compensation. Your annualized base salary will be [Amount], paid semi-monthly, subject to applicable withholdings.

2. Benefits. You will be eligible to participate in the Company's health, dental, and retirement plans, subject to the terms of those plans.

3. At-Will Employment. Your employment is at-will, meaning either you or the Company may terminate the relationship at any time, with or without cause or notice.`,
      `4. Confidentiality and IP. As a condition of employment, you must sign the Company's Confidentiality and Invention Assignment Agreement.

5. Paid Time Off. You will accrue paid time off at a rate of fifteen (15) days per year, increasing to twenty (20) days after three (3) years of service.

6. Start Date. Your anticipated start date is [Date], contingent on completion of background checks and eligibility-to-work verification.

This offer expires if not accepted within ten (10) business days.`,
    ],
  },
];
