import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScoreBadge from './ScoreBadge'

describe('ScoreBadge', () => {
  it('T9.1: renders red for score 1', () => {
    const { container } = render(<ScoreBadge score={1} />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('bg-red-500')
    expect(badge).toHaveTextContent('1')
  })

  it('T9.1: renders red for score 2', () => {
    const { container } = render(<ScoreBadge score={2} />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('bg-red-500')
  })

  it('T9.1: renders yellow for score 3', () => {
    const { container } = render(<ScoreBadge score={3} />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('bg-yellow-500')
  })

  it('T9.1: renders green for score 4', () => {
    const { container } = render(<ScoreBadge score={4} />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('bg-green-500')
  })

  it('T9.1: renders green for score 5', () => {
    const { container } = render(<ScoreBadge score={5} />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('bg-green-500')
  })

  it('renders dash for null score', () => {
    render(<ScoreBadge score={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders label with score', () => {
    render(<ScoreBadge score={4} label="B" />)
    expect(screen.getByText('B: 4')).toBeInTheDocument()
  })
})
