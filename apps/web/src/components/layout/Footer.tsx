import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/logo.png" alt="Orbya Travel" className="h-10 w-auto" />
            </Link>
            <p className="text-sm leading-relaxed">
              Plan and book complete trips — hotels, flights, transport and more.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cancellation policy</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookie policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Orbya Travels. All rights reserved.</p>
          <p className="text-sm">List your property on <Link href="/auth/signup?role=provider" className="text-brand-400 hover:text-brand-300">Orbya for Providers</Link></p>
        </div>
      </div>
    </footer>
  )
}
