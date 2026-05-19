import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page';

describe('Branding and UI Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies that the deep-tech forensic aesthetic components are rendered', () => {
    const { container } = render(<Home />);
    
    // Check for glassmorphism panels
    const glassPanels = container.querySelectorAll('.glass-panel');
    expect(glassPanels.length).toBeGreaterThan(0);
    
    // Check for the form action styling
    const formActions = container.querySelectorAll('.form-action');
    expect(formActions.length).toBeGreaterThan(0);
  });
});
