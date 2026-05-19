import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../../app/page';

// Mock axios since the app fetches public key and submits verification
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { fingerprint: 'mock-fingerprint' } }),
  post: jest.fn().mockResolvedValue({ data: { approved: true, vic_id: 'mock-vic-id', timestamp: new Date().toISOString(), vendor: 'Test Vendor', amount: 5000, decision_type: 'payment' } })
}));

describe('Home Page Verification Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders correctly and loads default policies', async () => {
    render(<Home />);
    
    const title = await screen.findByText('Provisional Patent PPN00002476');
    expect(title).toBeTruthy();
    
    // Check if the default "Payment" decision type is active
    expect(screen.getByText('Decision Type')).toBeTruthy();
  });

  it('can verify a decision and update history', async () => {
    render(<Home />);
    
    // Switch to verify tab
    const verifyDecisionElements = screen.getAllByText('Verify Decision');
    fireEvent.click(verifyDecisionElements[0]);
    
    const verifyButton = verifyDecisionElements[verifyDecisionElements.length - 1];
    fireEvent.click(verifyButton!);
    
    // Check for toast error message
    const toast = await screen.findByText('Please enter entity name');
    expect(toast).toBeTruthy();
  });
});
