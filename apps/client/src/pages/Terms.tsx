import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen bg-paper-50 dark:bg-midnight-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-neutral-400 hover:text-ink-700 dark:hover:text-neutral-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <article className="prose-article">
          <h1 className="font-display text-4xl text-ink-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-ink-500 dark:text-neutral-400 text-sm mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-ink-700 dark:text-neutral-300">
            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                1. Agreement to Terms
              </h2>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you and rivsy
                ("Company", "we", "our", or "us") governing your access to and use of our RSS reader application
                and related services (collectively, the "Service").
              </p>
              <p className="mb-4">
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with
                any part of these Terms, you do not have permission to access the Service.
              </p>
              <p>
                <strong>IMPORTANT:</strong> These Terms contain an arbitration clause and class action waiver
                (Section 16) that affect your legal rights. Please read them carefully.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                2. Eligibility
              </h2>
              <p className="mb-4">To use the Service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 13 years old (or 16 in the European Economic Area)</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Not be prohibited from using the Service under applicable law</li>
                <li>Not have been previously banned or removed from the Service</li>
              </ul>
              <p className="mt-4">
                If you are using the Service on behalf of an organization, you represent that you have authority
                to bind that organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                3. Description of Service
              </h2>
              <p className="mb-4">
                rivsy is an RSS reader application that allows you to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Subscribe to and organize RSS, Atom, and JSON feeds</li>
                <li>Read and save articles from subscribed feeds</li>
                <li>Use AI-powered features to summarize article content</li>
                <li>Sync your reading progress and preferences across devices</li>
                <li>Access both free and paid subscription tiers</li>
              </ul>
              <p className="mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time,
                with or without notice. We shall not be liable to you or any third party for any modification,
                suspension, or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                4. User Accounts
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                4.1 Account Creation
              </h3>
              <p className="mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access or security breach</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                4.2 Account Security
              </h3>
              <p>
                You are solely responsible for safeguarding your account credentials. We are not liable for
                any loss or damage arising from your failure to maintain account security. We may suspend or
                terminate accounts that we reasonably believe have been compromised.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                5. Subscriptions and Payment
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                5.1 Free and Paid Plans
              </h3>
              <p className="mb-4">
                The Service offers both free and paid subscription tiers. Paid subscriptions provide access to
                additional features as described on our pricing page.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                5.2 Billing
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Paid subscriptions are billed in advance on a recurring basis (monthly or annually)</li>
                <li>You authorize us to charge your payment method for all fees incurred</li>
                <li>All fees are exclusive of applicable taxes, which you are responsible for paying</li>
                <li>Prices are subject to change with 30 days' notice</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                5.3 Cancellation and Refunds
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may cancel your subscription at any time through your account settings</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds are provided for partial billing periods, except where required by law</li>
                <li>Upon cancellation, you retain access to paid features until the end of your billing period</li>
                <li>We may offer refunds at our sole discretion on a case-by-case basis</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                5.4 Free Trial
              </h3>
              <p>
                We may offer free trials of paid features. Unless you cancel before the trial ends, your
                payment method will be charged for the applicable subscription. Trial eligibility is determined
                at our sole discretion and may be limited to one trial per user.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                6. Acceptable Use Policy
              </h2>
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Violate any applicable law, regulation, or third-party rights</li>
                <li>Upload, transmit, or distribute any malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems, other users' accounts, or connected networks</li>
                <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
                <li>Circumvent, disable, or interfere with security features of the Service</li>
                <li>Scrape, crawl, or use automated means to access the Service without our written consent</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to send spam, unsolicited communications, or for any commercial purpose not intended</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Resell, redistribute, or sublicense access to the Service without authorization</li>
                <li>Use the AI features to generate content that is harmful, deceptive, or violates third-party rights</li>
                <li>Abuse, harass, threaten, or intimidate other users</li>
              </ul>
              <p>
                We reserve the right to investigate and take appropriate action against anyone who violates
                this section, including removing content, suspending or terminating accounts, and reporting
                to law enforcement.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                7. Intellectual Property
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                7.1 Our Intellectual Property
              </h3>
              <p className="mb-4">
                The Service, including its original content, features, functionality, design, and branding, is
                owned by rivsy and protected by copyright, trademark, and other intellectual property laws.
                You may not copy, modify, distribute, sell, or lease any part of our Service without our
                express written permission.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                7.2 Third-Party Content
              </h3>
              <p className="mb-4">
                RSS feed content, articles, and other third-party content accessed through the Service remain
                the property of their respective owners. We do not claim ownership of such content. Your use
                of third-party content is subject to the terms and conditions of the content owners.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                7.3 AI-Generated Content
              </h3>
              <p>
                Summaries and other content generated by our AI features are provided for informational purposes
                only. While we strive for accuracy, AI-generated content may contain errors or inaccuracies.
                You should verify important information independently.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                8. User Content
              </h2>
              <p className="mb-4">
                You retain ownership of any content you create, upload, or submit through the Service
                (e.g., feed organizations, tags, notes). By submitting content, you grant us a non-exclusive,
                worldwide, royalty-free license to use, store, and process that content solely for the purpose
                of providing the Service to you.
              </p>
              <p>
                You represent and warrant that you have all necessary rights to any content you submit and
                that such content does not violate any third-party rights or applicable laws.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                9. Privacy
              </h2>
              <p>
                Your use of the Service is also governed by our{' '}
                <Link to="/privacy" className="text-coral-500 hover:text-coral-600">
                  Privacy Policy
                </Link>
                , which is incorporated into these Terms by reference. Please review our Privacy Policy to
                understand how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                10. Third-Party Services and Links
              </h2>
              <p className="mb-4">
                The Service may contain links to third-party websites, services, or content that are not
                owned or controlled by us. We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The content, privacy policies, or practices of third-party websites or services</li>
                <li>Any damage or loss caused by your use of or reliance on third-party content</li>
                <li>The availability or accuracy of RSS feeds from third-party sources</li>
              </ul>
              <p className="mt-4">
                Your interactions with third-party services are solely between you and the third party.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                11. Disclaimers
              </h2>
              <p className="mb-4 uppercase text-sm">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="mb-4">We do not warrant that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results obtained from the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
                <li>The Service will meet your specific requirements</li>
                <li>AI-generated summaries will be accurate, complete, or suitable for any purpose</li>
              </ul>
              <p className="mt-4">
                Some jurisdictions do not allow the exclusion of certain warranties, so some of the above
                exclusions may not apply to you.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                12. Limitation of Liability
              </h2>
              <p className="mb-4 uppercase text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL RIVSY, ITS AFFILIATES, DIRECTORS,
                EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Loss of profits, revenue, data, or goodwill</li>
                <li>Cost of substitute services</li>
                <li>Personal injury or property damage</li>
                <li>Any other damages arising from your use of or inability to use the Service</li>
              </ul>
              <p className="mb-4 uppercase text-sm">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF (A) THE
                AMOUNTS YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED
                DOLLARS ($100).
              </p>
              <p>
                Some jurisdictions do not allow the limitation or exclusion of liability for incidental or
                consequential damages, so the above limitation may not apply to you.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                13. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless rivsy and its affiliates, officers, directors,
                employees, and agents from and against any claims, liabilities, damages, losses, costs, and
                expenses (including reasonable attorneys' fees) arising out of or relating to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit or transmit through the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                14. Account Termination
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                14.1 Termination by You
              </h3>
              <p className="mb-4">
                You may terminate your account at any time by using the account deletion feature in your
                settings or by contacting us. Upon termination, your right to use the Service will immediately
                cease.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                14.2 Termination by Us
              </h3>
              <p className="mb-4">
                We may suspend or terminate your account and access to the Service immediately, without prior
                notice or liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment of applicable fees</li>
                <li>Extended periods of inactivity</li>
                <li>Requests by law enforcement or government agencies</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                14.3 Effect of Termination
              </h3>
              <p>
                Upon termination, your right to use the Service will cease immediately. We may delete your
                account data in accordance with our Privacy Policy. Provisions of these Terms that by their
                nature should survive termination shall survive, including ownership provisions, warranty
                disclaimers, indemnification, and limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                15. Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of
                Delaware, United States, without regard to its conflict of law provisions. You agree to submit
                to the personal and exclusive jurisdiction of the courts located in Delaware for the resolution
                of any disputes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                16. Dispute Resolution and Arbitration
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                16.1 Informal Resolution
              </h3>
              <p className="mb-4">
                Before filing any claim, you agree to contact us at{' '}
                <a href="mailto:legal@rivsy.app" className="text-coral-500 hover:text-coral-600">
                  legal@rivsy.app
                </a>{' '}
                and attempt to resolve the dispute informally for at least 30 days.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                16.2 Binding Arbitration
              </h3>
              <p className="mb-4">
                If we cannot resolve a dispute informally, you and rivsy agree to resolve any claims through
                final and binding arbitration, except as set forth below. The American Arbitration Association
                (AAA) will administer the arbitration under its Consumer Arbitration Rules.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                16.3 Class Action Waiver
              </h3>
              <p className="mb-4 font-semibold">
                YOU AND RIVSY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL
                CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE
                PROCEEDING.
              </p>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                16.4 Exceptions
              </h3>
              <p>
                Either party may bring claims in small claims court if eligible. Either party may seek
                injunctive or other equitable relief in any court of competent jurisdiction to prevent
                infringement of intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                17. Force Majeure
              </h2>
              <p>
                We shall not be liable for any failure or delay in performance resulting from causes beyond
                our reasonable control, including but not limited to acts of God, natural disasters, war,
                terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents,
                pandemics, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                18. Changes to Terms
              </h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will provide notice of material
                changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending email notification for significant changes</li>
                <li>Displaying an in-app notification</li>
              </ul>
              <p className="mt-4">
                Your continued use of the Service after changes become effective constitutes acceptance of
                the revised Terms. If you do not agree to the revised Terms, you must stop using the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                19. General Provisions
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute
                  the entire agreement between you and rivsy regarding the Service.
                </li>
                <li>
                  <strong>Severability:</strong> If any provision of these Terms is found unenforceable, the
                  remaining provisions will continue in effect.
                </li>
                <li>
                  <strong>Waiver:</strong> Our failure to enforce any right or provision shall not be deemed
                  a waiver of such right or provision.
                </li>
                <li>
                  <strong>Assignment:</strong> You may not assign these Terms without our prior written consent.
                  We may assign these Terms without restriction.
                </li>
                <li>
                  <strong>No Third-Party Beneficiaries:</strong> These Terms do not create any third-party
                  beneficiary rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                20. Contact Us
              </h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:legal@rivsy.app" className="text-coral-500 hover:text-coral-600">
                    legal@rivsy.app
                  </a>
                </li>
                <li>
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@rivsy.app" className="text-coral-500 hover:text-coral-600">
                    support@rivsy.app
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
