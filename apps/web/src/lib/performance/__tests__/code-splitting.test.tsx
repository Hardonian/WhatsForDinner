import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CodeSplitting from '../code-splitting';

describe('code-splitting', () => {
  it('renders without crashing', () => {
    render(<CodeSplitting />);
    expect(screen.getByRole('main') || screen.getByTestId('code-splitting')).toBeDefined();
  });

  it('renders with required props', () => {
    const props = {};
    render(<CodeSplitting {...props} />);
    expect(screen.getByRole('main') || screen.getByTestId('code-splitting')).toBeDefined();
  });
});
