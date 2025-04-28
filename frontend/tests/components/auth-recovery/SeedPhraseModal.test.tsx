import { render, screen, fireEvent } from '../../testUtils';
import SeedPhraseModal from '../../../src/components/auth-recovery/SeedPhraseModal';

/**
 * Test suite for the SeedPhraseModal component including rendering and button functionality.
 */
describe('SeedPhraseModal.tsx tests', () => {
	it('should render the seed phrase modal', () => {
		render(<SeedPhraseModal seedPhrase="mock-seed-phrase" onAcknowledge={jest.fn()} />);

		expect(screen.getByText(/Save Your Seed Phrase/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /I have saved my seed phrase/i })).toBeInTheDocument();
		expect(screen.getByText(/mock-seed-phrase/i)).toBeInTheDocument();
	});

	it('should call onAcknowledge when the button is clicked', () => {
		const mockOnAcknowledge = jest.fn();
		render(<SeedPhraseModal seedPhrase="mock-seed-phrase" onAcknowledge={mockOnAcknowledge} />);

		fireEvent.click(screen.getByRole('button', { name: /I have saved my seed phrase/i }));

		expect(mockOnAcknowledge).toHaveBeenCalled();
	});
});
