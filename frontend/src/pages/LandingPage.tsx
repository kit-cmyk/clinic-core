import { Link } from 'react-router-dom'

const GREEN = 'oklch(0.6236 0.1833 147.4139)'
const GREEN_LIGHT = 'oklch(0.6236 0.1833 147.4139 / 0.1)'

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

const testimonials = [
  {
    quote: "ClinicAlly completely changed how we manage our practice. Our admin work dropped by 40% and patients love the self-service portal.",
    name: 'Dr. Sarah Nkosi',
    role: 'Family Physician, Cape Town',
    initials: 'SN',
  },
  {
    quote: "Finally a system that feels like it was designed by people who've actually worked in a clinic. Intuitive, fast, and our whole team was up in a day.",
    name: 'Marcus van der Berg',
    role: 'Practice Manager, Johannesburg',
    initials: 'MB',
  },
  {
    quote: "The multi-branch features are exceptional. We manage 4 locations from one dashboard and the reporting has transformed our decision-making.",
    name: 'Dr. Priya Chetty',
    role: 'Medical Director, Durban',
    initials: 'PC',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Space Grotesk, ui-sans-serif, sans-serif' }}>

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: GREEN }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">ClinicAlly</span>
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
              style={{ backgroundColor: GREEN }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — split layout */}
      <section className="relative overflow-hidden bg-white">
        {/* Background blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 80% 50%, oklch(0.6236 0.1833 147.4139 / 0.06), transparent)',
          }}
        />
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: GREEN, filter: 'blur(100px)', transform: 'translate(-30%, -30%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-8"
              style={{
                color: GREEN,
                borderColor: 'oklch(0.6236 0.1833 147.4139 / 0.3)',
                backgroundColor: 'oklch(0.6236 0.1833 147.4139 / 0.06)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: GREEN }}
              />
              Trusted by clinics worldwide
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight">
              Care-first
              <span className="block" style={{ color: GREEN }}>
                clinic management.
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg">
              ClinicAlly puts patients at the centre of everything — connecting appointments, records,
              billing, and your team so you can focus on what truly matters: delivering exceptional care.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-base font-semibold text-white px-8 py-3.5 rounded-xl transition-all hover:opacity-90"
                style={{
                  backgroundColor: GREEN,
                  boxShadow: '0 8px 30px oklch(0.6236 0.1833 147.4139 / 0.35)',
                }}
              >
                Start for free
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-base font-semibold text-gray-700 px-8 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-400">No credit card required · Set up in under 5 minutes</p>

            {/* Trust row */}
            <div className="mt-10 flex items-center gap-6 flex-wrap">
              {[
                { icon: '🔒', text: 'HIPAA Compliant' },
                { icon: '⚡', text: '99.9% Uptime' },
                { icon: '🏥', text: 'Multi-branch' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — image */}
          <div className="relative hidden lg:block">
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, oklch(0.6236 0.1833 147.4139 / 0.12), oklch(0.6999 0.1796 150.1066 / 0.08))',
                transform: 'rotate(2deg) scale(1.02)',
              }}
            />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ aspectRatio: '4/3' }}>
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80"
                alt="Doctor consulting with a patient in a modern clinic"
                className="w-full h-full object-cover"
              />
              {/* Floating stat card */}
              <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GREEN_LIGHT }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Today's appointments</div>
                  <div className="text-lg font-bold text-gray-900">24 patients seen</div>
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

      {/* Care mission section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div
              className="absolute -inset-4 rounded-3xl opacity-30"
              style={{ background: `linear-gradient(135deg, ${GREEN}, transparent)`, filter: 'blur(40px)' }}
            />
            <div className="relative rounded-3xl overflow-hidden shadow-xl" style={{ aspectRatio: '4/3' }}>
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"
                alt="A doctor attentively listening to a patient"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -right-4 top-8 bg-white rounded-2xl shadow-xl px-4 py-3 max-w-[180px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
                <span className="text-xs font-semibold text-gray-700">Patient satisfaction</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: GREEN }}>98.4%</div>
              <div className="text-xs text-gray-400 mt-0.5">avg. across clinics</div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <div
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: GREEN }}
            >
              Our mission
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              At the heart of everything,
              <span className="block" style={{ color: GREEN }}>it's about care.</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed">
              We built ClinicAlly because great healthcare starts with great tools. When your team spends
              less time on admin, they spend more time with patients — and that changes outcomes.
            </p>
            <div className="mt-8 space-y-5">
              {[
                {
                  title: 'Patient-first design',
                  desc: 'Every workflow is designed around the patient journey, from first booking to follow-up care.',
                },
                {
                  title: 'Trusted & secure',
                  desc: 'HIPAA-compliant infrastructure with end-to-end encryption keeps your patient data safe.',
                },
                {
                  title: 'Always there for you',
                  desc: '24/7 access from any device, with 99.9% uptime so your clinic never misses a beat.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: GREEN_LIGHT }}
                  >
                    <svg viewBox="0 0 16 16" fill={GREEN} className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: GREEN }}
            >
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Built for modern clinics
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From solo practitioners to multi-branch practices, ClinicAlly scales with your growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-transparent hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                  style={{
                    backgroundColor: GREEN_LIGHT,
                    color: GREEN,
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

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: GREEN }}
            >
              Loved by clinicians
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Hear from our clinics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-7 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow duration-200 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} viewBox="0 0 20 20" fill={GREEN} className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: GREEN }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
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
              style={{ color: GREEN }}
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
                    backgroundColor: index === 0 ? GREEN : 'white',
                    color: index === 0 ? 'white' : GREEN,
                    border: `2px solid oklch(0.6236 0.1833 147.4139 / 0.3)`,
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

      {/* CTA — with image */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1600&q=80"
                alt="Healthcare professionals"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.6236 0.1833 147.4139 / 0.92), oklch(0.4 0.18 147 / 0.96))',
                }}
              />
            </div>

            <div className="relative p-12 md:p-16 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30 text-white/90 mb-6 bg-white/10">
                <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                Care-first · Secure · Always on
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Ready to put patients first?
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
                Join hundreds of healthcare providers who have transformed their practice with ClinicAlly.
                Better care starts here.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-base font-semibold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 bg-white"
                  style={{ color: GREEN }}
                >
                  Create free account
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
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
              style={{ backgroundColor: GREEN }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">ClinicAlly</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ClinicAlly. Care-first clinic management.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-gray-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
