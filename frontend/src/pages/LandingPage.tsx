import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: 'Smart Scheduling',
    description: 'Intelligent appointment booking with automated reminders, conflict detection, and real-time availability across all your branches.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: 'Patient Management',
    description: 'Complete patient profiles with medical history, visit notes, prescriptions, lab results, and secure document storage in one place.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H18M15 10.5H6" />
      </svg>
    ),
    title: 'Billing & Invoicing',
    description: 'Streamlined invoicing with insurance support, payment tracking, and automated receipts — so your front desk spends less time on paperwork.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
      </svg>
    ),
    title: 'Patient Portal',
    description: 'Give patients a self-service portal to view appointments, download lab results, access prescriptions, and upload documents 24/7.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Analytics Dashboard',
    description: 'Real-time insights on appointments, revenue, patient volume, and staff performance to help you make data-driven decisions.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'Multi-Branch Support',
    description: 'Manage multiple clinic locations from a single platform with centralized data, staff assignment, and per-branch reporting.',
  },
]

const stats = [
  { value: '10,000+', label: 'Patients managed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '3 min', label: 'Avg. setup time' },
  { value: 'HIPAA', label: 'Compliant' },
]

const steps = [
  {
    number: '01',
    title: 'Register your clinic',
    description: 'Create your account and configure your clinic profile, branches, and staff in minutes.',
  },
  {
    number: '02',
    title: 'Import your patients',
    description: 'Bulk import existing patient records or start fresh — your data is always yours.',
  },
  {
    number: '03',
    title: 'Start seeing patients',
    description: 'Book appointments, conduct visits, issue prescriptions, and collect payments from day one.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Space Grotesk, ui-sans-serif, sans-serif' }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'oklch(0.6236 0.1833 147.4139)' }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">ClinicCore</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'oklch(0.6236 0.1833 147.4139)' }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.6236 0.1833 147.4139), transparent)',
          }}
        />
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-[0.06]"
          style={{ background: 'oklch(0.6236 0.1833 147.4139)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-40 right-10 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: 'oklch(0.6004 0.1694 249.8812)', filter: 'blur(100px)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-8"
            style={{
              color: 'oklch(0.6236 0.1833 147.4139)',
              borderColor: 'oklch(0.6236 0.1833 147.4139 / 0.3)',
              backgroundColor: 'oklch(0.6236 0.1833 147.4139 / 0.06)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: 'oklch(0.6236 0.1833 147.4139)' }}
            />
            Now live · Trusted by clinics worldwide
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight max-w-4xl mx-auto">
            The clinic management
            <span className="block" style={{ color: 'oklch(0.6236 0.1833 147.4139)' }}>
              platform that works
            </span>
            as hard as you do.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            ClinicCore brings appointments, patients, billing, and your team together in one
            beautifully simple system — so you can focus on care, not admin.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-xl transition-all hover:opacity-90"
              style={{
                backgroundColor: 'oklch(0.6236 0.1833 147.4139)',
                boxShadow: '0 8px 30px oklch(0.6236 0.1833 147.4139 / 0.35)',
              }}
            >
              Start for free
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-base font-semibold text-gray-700 px-8 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Sign in to your account
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-400">No credit card required · Set up in under 5 minutes</p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto px-6 pb-16">
          <div
            className="relative rounded-2xl overflow-hidden border border-gray-200"
            style={{ boxShadow: '0 40px 80px -20px rgba(0,0,0,0.15)' }}
          >
            {/* Browser chrome */}
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                  cliniccore-app.onrender.com/dashboard
                </div>
              </div>
            </div>
            {/* Mock UI */}
            <div className="bg-gray-50 p-4 grid grid-cols-12 gap-4 min-h-[320px]">
              <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
                <div
                  className="w-full h-6 rounded-md"
                  style={{ backgroundColor: 'oklch(0.6236 0.1833 147.4139 / 0.15)' }}
                />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-full h-4 rounded-md"
                    style={
                      i === 1
                        ? { backgroundColor: 'oklch(0.6236 0.1833 147.4139 / 0.2)' }
                        : { backgroundColor: '#f3f4f6' }
                    }
                  />
                ))}
              </div>
              <div className="col-span-10 flex flex-col gap-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Today's Appts", value: '24', color: 'oklch(0.6236 0.1833 147.4139)' },
                    { label: 'Patients', value: '1,284', color: 'oklch(0.6004 0.1694 249.8812)' },
                    { label: 'Revenue', value: '$8,420', color: 'oklch(0.6818 0.1924 45.7782)' },
                    { label: 'Pending', value: '7', color: 'oklch(0.6396 0.2105 300.0543)' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
                      <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                      <div className="text-lg font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 flex-1">
                  <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
                    <div className="text-xs font-semibold text-gray-400 mb-3">
                      Appointments this week
                    </div>
                    <div className="flex items-end gap-2 h-24">
                      {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            backgroundColor:
                              i === 3
                                ? 'oklch(0.6236 0.1833 147.4139)'
                                : 'oklch(0.6236 0.1833 147.4139 / 0.2)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="text-xs font-semibold text-gray-400 mb-3">Upcoming</div>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-100 rounded-full w-3/4" />
                          <div className="h-1.5 bg-gray-50 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.6236 0.1833 147.4139)' }}
            >
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Built for modern clinics
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From solo practitioners to multi-branch practices, ClinicCore scales with your growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: 'oklch(0.6236 0.1833 147.4139 / 0.1)',
                    color: 'oklch(0.6236 0.1833 147.4139)',
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'oklch(0.6236 0.1833 147.4139)' }}
            >
              Simple onboarding
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Up and running in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gray-200" />
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 font-bold text-xl"
                  style={{
                    backgroundColor:
                      index === 0 ? 'oklch(0.6236 0.1833 147.4139)' : 'white',
                    color:
                      index === 0 ? 'white' : 'oklch(0.6236 0.1833 147.4139)',
                    border: '2px solid oklch(0.6236 0.1833 147.4139 / 0.3)',
                  }}
                >
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden p-12 text-center"
            style={{
              background:
                'linear-gradient(135deg, oklch(0.6236 0.1833 147.4139), oklch(0.6999 0.1796 150.1066))',
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(30%, -30%)' }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white"
              style={{ transform: 'translate(-30%, 30%)' }}
            />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Ready to transform
                <br />
                your clinic?
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                Join hundreds of healthcare providers who have simplified their practice management
                with ClinicCore.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-base font-semibold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 bg-white"
                  style={{ color: 'oklch(0.6236 0.1833 147.4139)' }}
                >
                  Create free account
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-base font-semibold text-white/90 px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 transition-all"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/60">No credit card required · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'oklch(0.6236 0.1833 147.4139)' }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">ClinicCore</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ClinicCore. Modern clinic management for modern healthcare.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/login" className="hover:text-gray-600 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-gray-600 transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
