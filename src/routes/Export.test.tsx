import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'

const { mockExportExam } = vi.hoisted(() => ({
  mockExportExam: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  exportExam: mockExportExam,
}))

import Export from './Export'

beforeEach(() => {
  vi.clearAllMocks()
  mockExportExam.mockResolvedValue(undefined)
})

function renderExport() {
  return render(
    <MemoryRouter initialEntries={['/exams/exam1/export']}>
      <Routes>
        <Route path="/exams/:examId/export" element={<Export />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Export', () => {
  it('T10.1: clicking CSV button calls exportExam with format "csv"', async () => {
    renderExport()

    const csvButton = screen.getByText('CSV').closest('button')!
    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(mockExportExam).toHaveBeenCalledWith('exam1', 'csv')
    })
  })

  it('clicking Markdown button calls exportExam with format "markdown"', async () => {
    renderExport()

    const mdButton = screen.getByText('Markdown').closest('button')!
    fireEvent.click(mdButton)

    await waitFor(() => {
      expect(mockExportExam).toHaveBeenCalledWith('exam1', 'markdown')
    })
  })

  it('shows error message on export failure', async () => {
    mockExportExam.mockRejectedValue(new Error('Export mislukt'))

    renderExport()

    const csvButton = screen.getByText('CSV').closest('button')!
    fireEvent.click(csvButton)

    expect(await screen.findByText('Export mislukt')).toBeInTheDocument()
  })

  it('renders three export format buttons', () => {
    renderExport()

    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('Markdown')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('has a back link to the dashboard', () => {
    renderExport()
    const backLink = screen.getByText(/Terug naar dashboard/)
    expect(backLink.closest('a')).toHaveAttribute('href', '/exams/exam1')
  })
})
