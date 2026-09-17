import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PantryManager from '../PantryManager';

const mockItems = [
  { id: 1, ingredient: 'tomatoes', quantity: 3 },
  { id: 2, ingredient: 'onions', quantity: 2 },
  { id: 3, ingredient: 'garlic', quantity: 1 },
];

const defaultProps = {
  items: mockItems,
  onAdd: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
};

describe('PantryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders add form and pantry items', () => {
    render(<PantryManager {...defaultProps} />);

    expect(screen.getByText('Add New Item')).toBeInTheDocument();
    expect(screen.getByText('Your Pantry')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('e.g., tomatoes, chicken breast...')
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('displays all pantry items with quantities', () => {
    render(<PantryManager {...defaultProps} />);

    expect(screen.getByText('tomatoes')).toBeInTheDocument();
    expect(screen.getByText('onions')).toBeInTheDocument();
    expect(screen.getByText('garlic')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onAdd when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const ingredientInput = screen.getByPlaceholderText(
      'e.g., tomatoes, chicken breast...'
    );
    const quantityInput = screen.getByDisplayValue('1');
    const addButton = screen.getByRole('button', { name: /add item/i });

    await user.type(ingredientInput, 'pasta');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    await user.click(addButton);

    expect(defaultProps.onAdd).toHaveBeenCalledWith('pasta', 2);
  });

  it('does not call onAdd when ingredient is empty', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it('resets form after adding item', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const ingredientInput = screen.getByPlaceholderText(
      'e.g., tomatoes, chicken breast...'
    );
    const addButton = screen.getByRole('button', { name: /add item/i });

    await user.type(ingredientInput, 'pasta');
    await user.click(addButton);

    expect(ingredientInput).toHaveValue('');
  });

  it('calls onUpdate when quantity buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: /\+/i });
    const decrementButtons = screen.getAllByRole('button', { name: /-/i });

    // Test increment
    await user.click(incrementButtons[0]);
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(1, 4);

    // Test decrement
    await user.click(decrementButtons[0]);
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(1, 3);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(1);
  });

  it('shows empty state when no items', () => {
    render(<PantryManager {...defaultProps} items={[]} />);

    expect(
      screen.getByText(
        'No items in your pantry yet. Add some ingredients to get started!'
      )
    ).toBeInTheDocument();
  });

  it('prevents quantity from going below 1', async () => {
    const user = userEvent.setup();
    render(<PantryManager {...defaultProps} />);

    const decrementButtons = screen.getAllByRole('button', { name: /-/i });

    // Click decrement multiple times to try to go below 1
    await user.click(decrementButtons[0]);
    await user.click(decrementButtons[0]);
    await user.click(decrementButtons[0]);

    // Should only call onUpdate with minimum value of 1
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(1, 2);
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(1, 1);
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(1, 1); // Should not go below 1
  });

  it('validates required ingredient field', () => {
    render(<PantryManager {...defaultProps} />);

    const ingredientInput = screen.getByPlaceholderText(
      'e.g., tomatoes, chicken breast...'
    );
    expect(ingredientInput).toBeRequired();
  });

  it('sets minimum quantity to 1', () => {
    render(<PantryManager {...defaultProps} />);

    const quantityInput = screen.getByDisplayValue('1');
    expect(quantityInput).toHaveAttribute('min', '1');
  });
});
