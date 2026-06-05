import { redirect } from 'next/navigation'

// /countries is the same as /trips — keep one canonical URL
export default function CountriesPage() {
  redirect('/trips')
}
