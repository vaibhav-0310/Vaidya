import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../src/pages/blogs/card';
import '@testing-library/jest-dom';

describe('Card Component', () => {
  const mockProps = {
    title: 'Test Title',
    image: 'test-image.jpg',
    description: 'This is a test description for the card component.',
  };

  it('renders without crashing', () => {
    render(<Card {...mockProps} />);
  });

  it('displays the title', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText(mockProps.title)).toBeInTheDocument();
  });

  it('displays the image', () => {
    render(<Card {...mockProps} />);
    const img = screen.getByAltText(mockProps.title);
    expect(img).toHaveAttribute('src', mockProps.image);
  });

  it('displays the description', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText(mockProps.description)).toBeInTheDocument();
  });

  it('has a "Read More" link', () => {
    render(<Card {...mockProps} />);
    expect(screen.getByText('Read More →')).toBeInTheDocument();
  });
});