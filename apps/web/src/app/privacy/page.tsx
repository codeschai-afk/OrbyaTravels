import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Orbya Travels',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Who we are</h2>
          <p className="text-gray-600 leading-relaxed">
            Orbya Travels (&quot;Orbya&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the travel booking platform
            available at <strong>www.orbyatravel.com</strong>. We connect travellers with local
            service providers across Nepal and India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information we collect</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed">
            <li><strong>Account information:</strong> name, email address, and profile picture when you sign up or sign in with Google.</li>
            <li><strong>Booking data:</strong> trip details, traveller count, dates, and payment references.</li>
            <li><strong>Usage data:</strong> pages visited, search queries, and device/browser information collected via standard web logs.</li>
            <li><strong>Communications:</strong> messages you send to providers or our support team.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How we use your information</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed">
            <li>To create and manage your account.</li>
            <li>To process and confirm bookings.</li>
            <li>To send booking confirmations, updates, and customer support responses.</li>
            <li>To improve our platform and personalise your experience.</li>
            <li>To comply with applicable laws and prevent fraud.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Sharing your information</h2>
          <p className="text-gray-600 leading-relaxed">
            We share your information only as necessary:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed mt-2">
            <li><strong>Service providers</strong> you book with — to fulfil your reservation.</li>
            <li><strong>Payment processors</strong> — to handle transactions securely.</li>
            <li><strong>Infrastructure providers</strong> (e.g. cloud hosting, email delivery) bound by confidentiality obligations.</li>
            <li><strong>Legal authorities</strong> when required by law.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-2">
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Google sign-in</h2>
          <p className="text-gray-600 leading-relaxed">
            When you choose to sign in with Google, we receive your name, email address, and profile
            picture from Google. We use this data only to create and authenticate your Orbya account.
            We do not request access to your Gmail, Drive, or any other Google services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Data retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your personal data for as long as your account is active or as needed to provide
            services. You may request deletion of your account and associated data by contacting us at
            the address below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Your rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You have the right to access, correct, or delete the personal data we hold about you.
            To exercise any of these rights, email us at <strong>privacy@orbyatravel.com</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use essential session cookies to keep you signed in and functional cookies to remember
            your preferences. No third-party advertising cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to this policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this policy from time to time. When we do, we will revise the &quot;last
            updated&quot; date at the top of this page. Continued use of Orbya after changes are posted
            constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact us</h2>
          <p className="text-gray-600 leading-relaxed">
            For any privacy-related questions, contact us at:<br />
            <strong>Orbya Travels</strong><br />
            Email: <a href="mailto:privacy@orbyatravel.com" className="text-brand-600 hover:underline">privacy@orbyatravel.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
