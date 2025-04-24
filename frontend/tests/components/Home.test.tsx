import { render, screen } from '../testUtils';
import Home from '../../src/components/Home';

test('renders home component', () => {
	render(<Home />);
	expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
});
