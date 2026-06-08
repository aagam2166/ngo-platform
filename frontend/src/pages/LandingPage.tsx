import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function LandingPage() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  // Redirect logged-in users to their role-specific dashboard
  if (isAuthenticated && user) {
    const roleDestinations: Record<string, string> = {
      CITIZEN:     '/dashboard',
      NGO_ADMIN:   '/ngo/dashboard',
      VOLUNTEER:   '/volunteer/dashboard',
      SUPER_ADMIN: '/admin',
    };
    const destination = roleDestinations[user.role] ?? '/dashboard';
    return <Navigate to={destination} replace />;
  }
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <header className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-24 pb-28 px-6 text-center">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(249,115,22,0.1),transparent_60%)]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 tracking-wide uppercase border border-slate-700/50">
            Community Aid Network
          </span>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
            NGO <span className="text-orange-500">Platform</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Connecting citizens in need with trusted local NGOs and volunteers who can make an immediate impact.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md active:scale-[0.99]"
            >
              Get Started / Register
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-slate-700 bg-slate-800/40 text-slate-200 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all active:scale-[0.99]"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive Role Navigation Cards */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 pb-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Citizens Link */}
          <Link
            to="/register?role=citizen"
            className={`group bg-white rounded-2xl p-7 border text-left block transition-all duration-200 ${
              hoveredCard === 1 
                ? 'shadow-md border-orange-200 -translate-y-0.5' 
                : 'shadow-sm border-slate-100'
            }`}
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mb-5 text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">Citizens</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Submit help requests directly to the platform and track their remediation progress in real time.
            </p>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider inline-flex items-center gap-1 group-hover:text-orange-500 transition-colors">
              Request Assistance &rarr;
            </div>
          </Link>

          {/* Card 2: NGOs Link */}
          <Link
            to="/register?role=ngo"
            className={`group bg-white rounded-2xl p-7 border text-left block transition-all duration-200 ${
              hoveredCard === 2 
                ? 'shadow-md border-orange-200 -translate-y-0.5' 
                : 'shadow-sm border-slate-100'
            }`}
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center mb-5 text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V11m0 0h4m-4 0h-4m4 0v10m12 4a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">NGOs</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Manage local incoming relief claims, audit credentials, and coordinate task distributions.
            </p>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider inline-flex items-center gap-1 group-hover:text-orange-500 transition-colors">
              Register Organization &rarr;
            </div>
          </Link>

          {/* Card 3: Volunteers Link */}
          <Link
            to="/register?role=volunteer"
            className={`group bg-white rounded-2xl p-7 border text-left block transition-all duration-200 ${
              hoveredCard === 3 
                ? 'shadow-md border-orange-200 -translate-y-0.5' 
                : 'shadow-sm border-slate-100'
            }`}
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center mb-5 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">Volunteers</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              Discover verified regional field ops, join local efforts, and support active relief programs.
            </p>
            <div className="text-xs font-bold text-purple-600 uppercase tracking-wider inline-flex items-center gap-1 group-hover:text-orange-500 transition-colors">
              Join Network &rarr;
            </div>
          </Link>

        </div>
      </section>
    </div>
  );
}