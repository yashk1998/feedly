import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-ink-500 dark:text-neutral-400 text-sm mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="space-y-8 text-ink-700 dark:text-neutral-300">
            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                1. Introduction
              </h2>
              <p className="mb-4">
                rivsy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our RSS reader
                application and related services (collectively, the "Service").
              </p>
              <p>
                By accessing or using our Service, you acknowledge that you have read, understood, and agree to
                be bound by this Privacy Policy. If you do not agree with the terms of this Privacy Policy,
                please do not access the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                2. Information We Collect
              </h2>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                2.1 Personal Information
              </h3>
              <p className="mb-4">We may collect personal information that you voluntarily provide when using our Service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Account information: email address, name, and profile picture (via authentication provider)</li>
                <li>Payment information: billing address, payment method details (processed by third-party payment processors)</li>
                <li>Communications: any information you provide when contacting our support team</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                2.2 Usage Data
              </h3>
              <p className="mb-4">We automatically collect certain information when you use the Service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>RSS feed URLs you subscribe to and organize</li>
                <li>Articles you read, save, or mark as favorites</li>
                <li>Reading preferences and settings</li>
                <li>Feature usage patterns and interactions</li>
                <li>AI summary requests and usage statistics</li>
              </ul>

              <h3 className="font-semibold text-ink-800 dark:text-neutral-200 mt-4 mb-2">
                2.3 Device and Technical Information
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device type, operating system, and browser type</li>
                <li>IP address and general location (city/country level)</li>
                <li>Access times and referring URLs</li>
                <li>Error logs and performance data</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                3. How We Use Your Information
              </h2>
              <p className="mb-4">We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> Provide, maintain, and improve the Service functionality</li>
                <li><strong>Personalization:</strong> Customize your experience and deliver relevant content</li>
                <li><strong>AI Features:</strong> Generate article summaries using artificial intelligence</li>
                <li><strong>Sync:</strong> Synchronize your feeds, articles, and reading progress across devices</li>
                <li><strong>Communication:</strong> Send service-related notifications, updates, and support responses</li>
                <li><strong>Analytics:</strong> Analyze usage patterns to improve the Service</li>
                <li><strong>Security:</strong> Detect, prevent, and address technical issues and abuse</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and legal processes</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                4. Third-Party Services
              </h2>
              <p className="mb-4">We use trusted third-party services to operate our Service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Authentication:</strong> Clerk (for secure user authentication)</li>
                <li><strong>AI Processing:</strong> OpenAI (for article summarization - article content is processed but not stored by OpenAI for training)</li>
                <li><strong>Payment Processing:</strong> Stripe (for subscription billing - we do not store full payment card details)</li>
                <li><strong>Hosting:</strong> Cloud infrastructure providers for data storage and processing</li>
              </ul>
              <p>
                Each third-party service has its own privacy policy governing their use of your data. We encourage
                you to review their policies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                5. Data Sharing and Disclosure
              </h2>
              <p className="mb-4">We do not sell your personal information. We may share your information only in these circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With third-party vendors who assist in operating our Service, subject to confidentiality obligations</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or legal process</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (you will be notified)</li>
                <li><strong>With Consent:</strong> When you have given explicit consent to share specific information</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                6. Data Retention
              </h2>
              <p className="mb-4">We retain your information for as long as necessary to provide the Service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Data:</strong> Retained until you delete your account</li>
                <li><strong>Usage Logs:</strong> Retained for up to 90 days for operational purposes</li>
                <li><strong>AI Summary Cache:</strong> Cached summaries are retained for up to 30 days</li>
                <li><strong>Backup Data:</strong> May persist in backups for up to 30 days after deletion</li>
              </ul>
              <p className="mt-4">
                After account deletion, we will delete or anonymize your personal information within 30 days,
                except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                7. Data Security
              </h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure authentication protocols</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and employee training</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the Internet is
                100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                8. Cookies and Tracking Technologies
              </h2>
              <p className="mb-4">We use the following types of cookies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Preference Cookies:</strong> Remember your settings (theme, reading preferences)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service (anonymized)</li>
              </ul>
              <p className="mt-4">
                We do not use advertising cookies or sell data to advertisers. You can control cookies through
                your browser settings, though disabling essential cookies may affect Service functionality.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                9. Your Rights and Choices
              </h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request your data in a portable format (JSON/CSV export)</li>
                <li><strong>Opt-Out:</strong> Opt out of marketing communications</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@rivsy.app" className="text-coral-500 hover:text-coral-600">
                  privacy@rivsy.app
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                10. International Data Transfers
              </h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of
                residence. These countries may have different data protection laws. When we transfer data
                internationally, we implement appropriate safeguards, including Standard Contractual Clauses
                approved by relevant authorities, to ensure your data remains protected.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                11. California Privacy Rights (CCPA)
              </h2>
              <p className="mb-4">
                California residents have additional rights under the California Consumer Privacy Act:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to know what personal information is collected, used, and shared</li>
                <li>Right to delete personal information (with certain exceptions)</li>
                <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
              <p className="mt-4">
                To make a request, contact us at{' '}
                <a href="mailto:privacy@rivsy.app" className="text-coral-500 hover:text-coral-600">
                  privacy@rivsy.app
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                12. European Privacy Rights (GDPR)
              </h2>
              <p className="mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland,
                you have rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Legal basis for processing: We process data based on consent, contract performance, legitimate interests, or legal obligations</li>
                <li>You may lodge a complaint with your local data protection authority</li>
                <li>You may withdraw consent at any time (without affecting lawfulness of prior processing)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                13. Children's Privacy
              </h2>
              <p>
                Our Service is not intended for children under 13 years of age (or 16 in the EEA). We do not
                knowingly collect personal information from children. If you believe we have collected
                information from a child, please contact us immediately at{' '}
                <a href="mailto:privacy@rivsy.app" className="text-coral-500 hover:text-coral-600">
                  privacy@rivsy.app
                </a>
                , and we will delete such information.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                14. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by
                posting the new policy on this page and updating the "Last updated" date. For significant changes,
                we will provide additional notice (such as email notification or in-app alert). Your continued
                use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-ink-900 dark:text-white mb-3">
                15. Contact Us
              </h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@rivsy.app" className="text-coral-500 hover:text-coral-600">
                    privacy@rivsy.app
                  </a>
                </li>
                <li>
                  <strong>Data Protection Inquiries:</strong>{' '}
                  <a href="mailto:dpo@rivsy.app" className="text-coral-500 hover:text-coral-600">
                    dpo@rivsy.app
                  </a>
                </li>
              </ul>
              <p className="mt-4">
                We aim to respond to all legitimate requests within 30 days.
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
