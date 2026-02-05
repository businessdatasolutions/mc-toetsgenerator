import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BloomBadge from './BloomBadge'

describe('BloomBadge', () => {
  it('T9.2: renders "Toepassen" with teal styling', () => {
    const { container } = render(<BloomBadge level="toepassen" />)
    expect(screen.getByText('Toepassen')).toBeInTheDocument()
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('text-teal-700')
  })

  it('renders "Onthouden" with gray styling', () => {
    const { container } = render(<BloomBadge level="onthouden" />)
    expect(screen.getByText('Onthouden')).toBeInTheDocument()
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('text-gray-700')
  })

  it('renders "Begrijpen" with blue styling', () => {
    const { container } = render(<BloomBadge level="begrijpen" />)
    expect(screen.getByText('Begrijpen')).toBeInTheDocument()
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('text-blue-700')
  })

  it('renders "Analyseren" with amber styling', () => {
    const { container } = render(<BloomBadge level="analyseren" />)
    expect(screen.getByText('Analyseren')).toBeInTheDocument()
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('text-amber-700')
  })

  it('renders dash for null level', () => {
    render(<BloomBadge level={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
