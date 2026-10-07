import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../page';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockCreateClient = jest.fn();

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: (...args: any[]) => mockCreateClient(...args),
}));

jest.mock('@/lib/supabase/auth-helpers-compat', () => ({
  createClientComponentClient: (...args: any[]) => mockCreateClient(...args),
}));

describe('Home Page Router', () => {
  const mockPush = jest.fn();
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });
  });

  it('renders loading state initially', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})); // pending promise
    render(<HomePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /home', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });

  it('redirects authenticated users to /dashboard', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    render(<HomePage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
