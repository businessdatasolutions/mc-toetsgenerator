import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('should pass a basic sanity check', () => {
    expect(true).toBe(true)
  })

  it('renders the heading with Tailwind class', () => {
    render(<App />)
    const heading = screen.getByText('MC Toetsvalidatie & Generatie')
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveClass('text-red-500')
  })
})
