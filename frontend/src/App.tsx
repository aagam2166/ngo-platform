import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
      {/* Verification Header */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg rotate-3 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
            <span className="font-bold text-xl tracking-tight">NGO Platform</span>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Backend</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Frontend</span>
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Docs</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-8 mb-12 relative">
          <div className="absolute inset-0 blur-3xl bg-cyan-500/20 rounded-full"></div>
          <img src={viteLogo} className="h-24 w-24 relative hover:drop-shadow-[0_0_2em_#646cffaa] transition-all" alt="Vite logo" />
          <span className="text-4xl font-thin text-slate-700">+</span>
          <img src={reactLogo} className="h-24 w-24 relative animate-[spin_20s_linear_infinite] hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all" alt="React logo" />
        </div>

        {/* Hero Text */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-black tracking-tighter">
            Tailwind <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">v4 is Active</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            If this page has a dark background, centered elements, and gradient text, your 
            <code className="mx-1 px-2 py-1 bg-slate-800 rounded border border-white/10 text-cyan-300 text-sm font-mono">@tailwindcss/vite</code> 
            plugin is working perfectly.
          </p>
        </div>

        {/* Interactive Element */}
        <button
          onClick={() => setCount((count) => count + 1)}
          className="group relative px-8 py-4 font-bold text-white transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur-lg opacity-40 group-hover:opacity-100 group-active:opacity-70 transition-opacity"></div>
          <div className="relative bg-slate-900 border border-white/20 px-8 py-4 rounded-xl group-hover:border-cyan-400/50 transition-colors">
            Current Count: <span className="text-cyan-400 ml-1 font-mono">{count}</span>
          </div>
        </button>

        {/* Grid Check */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
          {[
            { title: 'Vite HMR', desc: 'Instant feedback on save' },
            { title: 'TypeScript', desc: 'Type-safe development' },
            { title: 'Prisma', desc: 'Database layer ready' }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-lg mb-2 text-slate-100">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App