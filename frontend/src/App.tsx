import { Outlet } from 'react-router-dom';

function SentryTestButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        padding: '6px 12px',
        background: '#e11d48',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      Test Sentry
    </button>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <SentryTestButton />}
    </>
  );
}
