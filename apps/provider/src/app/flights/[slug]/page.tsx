export default function FlightsDetailPage({ params }: { params: { slug: string } }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{params.slug}</h1>
      <p className="text-gray-500">Listing detail + edit form — Phase 4</p>
    </div>
  )
}
