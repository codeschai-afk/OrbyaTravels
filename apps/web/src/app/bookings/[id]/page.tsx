export default function BookingDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-gray-900">Booking #{params.id}</h1>
        <p className="text-gray-500 mt-2">Booking detail + timeline — Phase 3</p>
      </div>
    </div>
  )
}
