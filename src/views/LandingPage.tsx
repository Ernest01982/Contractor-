import React from 'react';
import { CheckCircle2, Hammer, Smartphone, Zap, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Hammer className="text-emerald-600 h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">Contractor Pro</span>
        </div>
        <div className="flex gap-4 items-center">
          <a href="#" onClick={handleLogin} className="text-slate-600 font-medium hover:text-slate-900 transition">Log in</a>
          <button onClick={onSignUp} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition shadow-sm">
            Start Free
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold mb-6">
          <Zap className="h-4 w-4" /> Built for South African Contractors
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
          Your Digital Site Office.<br/>
          <span className="text-emerald-600">Get Paid Before You Leave.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop writing quotes at 9 PM. Generate professional, trade-specific quotes on-site, send them via WhatsApp, and collect Payfast deposits instantly—even during loadshedding.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={onSignUp} className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg flex items-center justify-center gap-2">
            Create Your Workspace <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-sm text-slate-500 sm:hidden">No credit card required. 14-day free trial.</p>
        </div>
        <p className="hidden sm:block mt-4 text-sm text-slate-500 font-medium">No credit card required. 14-day free trial.</p>
      </header>

      {/* HOW IT WORKS / FEATURES */}
      <section className="bg-slate-900 py-24 px-6 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Contractor Pro Works</h2>
            <p className="text-slate-400 text-lg">From handshake to deposit in under 3 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition">
              <Smartphone className="h-12 w-12 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">1. Quote On-Site (Offline)</h3>
              <p className="text-slate-400">Our dynamic calculators handle the math for painters, plumbers, and builders. Works perfectly even with zero cell signal.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition">
              <Zap className="h-12 w-12 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">2. Push to WhatsApp</h3>
              <p className="text-slate-400">Instantly generate a rich-text summary and a professional PDF link sent directly to your client's WhatsApp.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">3. Instant Deposits</h3>
              <p className="text-slate-400">Clients click 'Accept' and are immediately taken to Payfast to pay your required deposit. Secure your cash flow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE BOOKKEEPER HOOK */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="md:flex">
            <div className="md:w-1/2 p-10 bg-emerald-50 flex flex-col justify-center">
              <FileSpreadsheet className="h-16 w-16 text-emerald-600 mb-6" />
              <h2 className="text-3xl font-bold mb-4 text-slate-900">The Bookkeeper Magic Link</h2>
              <p className="text-slate-600 text-lg">
                Stop chasing receipts at month-end. Generate a secure, one-click link for your accountant that downloads a perfect Excel sheet of all your paid quotes, VAT, and expenses.
              </p>
            </div>
            <div className="md:w-1/2 p-10 bg-slate-900 text-white flex flex-col justify-center">
               <h3 className="text-xl font-bold text-emerald-400 mb-6">What they see:</h3>
               <ul className="space-y-4">
                 <li className="flex gap-3"><CheckCircle2 className="text-emerald-500" /> Auto-calculated output VAT</li>
                 <li className="flex gap-3"><CheckCircle2 className="text-emerald-500" /> Payfast transaction references</li>
                 <li className="flex gap-3"><CheckCircle2 className="text-emerald-500" /> Linked receipt images (Slip-Snap)</li>
                 <li className="flex gap-3"><CheckCircle2 className="text-emerald-500" /> Net Profit estimations</li>
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to ditch the paperwork?</h2>
        <button onClick={handleLogin} className="inline-block bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg">
          Start Your 14-Day Free Trial
        </button>
        <p className="mt-8 text-slate-500">© {new Date().getFullYear()} Contractor Pro. Proudly built in South Africa.</p>
      </footer>
    </div>
  );
}
