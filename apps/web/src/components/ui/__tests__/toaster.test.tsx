import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Toaster from '../toaster.tsx';

describe('toaster', () => {
  it('renders without crashing', () => {
    render(<Toaster />);
    expect(screen.getByRole('main') || screen.getByTestId('toaster')).toBeDefined();
  });

  it('renders with required props', () => {
    const props = {};
    render(<Toaster {...props} />);
    expect(screen.getByRole('main') || screen.getByTestId('toaster')).toBeDefined();
  });
});
