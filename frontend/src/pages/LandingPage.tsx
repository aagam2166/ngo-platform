import Navbar from '../components/layout/Navbar';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Community Aid Platform
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          NGO <span className="text-orange-500">Platform</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Connecting citizens in need with NGOs and volunteers who can help.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/register"
            className="bg-orange-500 text-white px-7 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Get Help
          </Link>
          <Link
            to="/login"
            className="border border-gray-300 bg-white text-gray-700 px-7 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            Login
          </Link>
        </div>
      </main>

      {/* Cards row */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-orange-500 text-lg">🙋</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Citizens</h3>
          <p className="text-sm text-gray-500">Submit help requests and track their status in real time.</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-orange-500 text-lg">🏢</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">NGOs</h3>
          <p className="text-sm text-gray-500">Manage incoming requests and coordinate volunteer efforts.</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-orange-500 text-lg">🤝</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Volunteers</h3>
          <p className="text-sm text-gray-500">Find opportunities and make a direct impact in your community.</p>
        </div>
      </section>
    </div>
  );
}