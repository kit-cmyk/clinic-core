import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import App from '@/App';
import LandingPage from '@/pages/LandingPage';
import NotFoundPage from '@/pages/NotFoundPage';

const testRoutes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

function renderWithRouter(initialEntry = '/') {
  const router = createMemoryRouter(testRoutes, { initialEntries: [initialEntry] });
  return render(<RouterProvider router={router} />);
}

describe('App routing', () => {
  it('renders LandingPage at /', () => {
    renderWithRouter('/');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('ClinicCore')).toBeInTheDocument();
  });

  it('renders NotFoundPage at unknown route', () => {
    renderWithRouter('/does-not-exist');
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
