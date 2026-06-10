import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Orbya Travels',
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using the Orbya Travels platform at <strong>www.orbyatravel.com</strong>
            , you agree to be bound by these Terms of Service. If you do not agree, please do not use
            our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of service</h2>
          <p className="text-gray-600 leading-relaxed">
            Orbya Travels is an online marketplace that enables travellers to discover and book travel
            services — including accommodation, guided tours, and transport — offered by independent
            service providers operating in Nepal and India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Accounts</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 18 years old to create an account and make bookings.</li>
            <li>Orbya reserves the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Bookings and payments</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed">
            <li>When you complete a booking, you enter into a direct agreement with the service provider.</li>
            <li>Orbya acts as an intermediary and is not a party to that agreement.</li>
            <li>All prices are displayed inclusive of applicable taxes unless stated otherwise.</li>
            <li>Payment is processed securely through our third-party payment provider.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Cancellations and refunds</h2>
          <p className="text-gray-600 leading-relaxed">
            Cancellation and refund terms are set by individual service providers and are displayed
            on each listing before you book. Orbya will facilitate refunds in accordance with the
            provider&apos;s stated policy. In cases of provider failure to deliver the service, please
            contact support at <a href="mailto:support@orbyatravel.com" className="text-brand-600 hover:underline">support@orbyatravel.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Provider obligations</h2>
          <p className="text-gray-600 leading-relaxed">
            Service providers listed on Orbya agree to:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed mt-2">
            <li>Provide accurate and up-to-date listing information.</li>
            <li>Honour confirmed bookings.</li>
            <li>Hold all required licences and permits for their services.</li>
            <li>Comply with applicable local laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Prohibited conduct</h2>
          <p className="text-gray-600 leading-relaxed">You agree not to:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2 leading-relaxed mt-2">
            <li>Use the platform for any unlawful purpose.</li>
            <li>Post false, misleading, or fraudulent content.</li>
            <li>Attempt to circumvent Orbya&apos;s payment system by dealing directly with providers outside the platform.</li>
            <li>Scrape, crawl, or copy content without written permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Intellectual property</h2>
          <p className="text-gray-600 leading-relaxed">
            All content on the platform — including the Orbya logo, design, and text — is owned by
            or licensed to Orbya Travels. You may not reproduce or distribute it without prior
            written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Limitation of liability</h2>
          <p className="text-gray-600 leading-relaxed">
            Orbya Travels is a marketplace platform and is not liable for the actions, omissions, or
            service quality of independent providers. To the maximum extent permitted by law, our
            aggregate liability for any claim arising from your use of the platform is limited to the
            amount you paid for the relevant booking.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Governing law</h2>
          <p className="text-gray-600 leading-relaxed">
            These terms are governed by the laws of Nepal. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Kathmandu, Nepal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Changes to these terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms at any time. Continued use of the platform after changes are
            posted constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            Questions about these terms? Reach us at:<br />
            <strong>Orbya Travels</strong><br />
            Email: <a href="mailto:legal@orbyatravel.com" className="text-brand-600 hover:underline">legal@orbyatravel.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
