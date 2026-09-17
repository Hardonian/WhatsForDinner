import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../progress-bar';

describe('progress-bar', () => {
  it('renders without crashing', () => {
    render(<ProgressBar />);
    expect(screen.getByRole('main') || screen.getByTestId('progress-bar')).toBeDefined();
  });

  it('renders with required props', () => {
    const props = {};
    render(<ProgressBar {...props} />);
    expect(screen.getByRole('main') || screen.getByTestId('progress-bar')).toBeDefined();
  });
});
