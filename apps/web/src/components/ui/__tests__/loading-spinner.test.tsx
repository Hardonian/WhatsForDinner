import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../loading-spinner';

describe('loading-spinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('main') || screen.getByTestId('loading-spinner')).toBeDefined();
  });

  it('renders with required props', () => {
    const props = {};
    render(<LoadingSpinner {...props} />);
    expect(screen.getByRole('main') || screen.getByTestId('loading-spinner')).toBeDefined();
  });
});
