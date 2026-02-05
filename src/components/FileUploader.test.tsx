import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FileUploader from './FileUploader'

describe('FileUploader', () => {
  it('T8.5: calls onFileSelected when a file is dropped', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)

    const dropZone = screen.getByTestId('file-uploader')
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('displays file name and size after selection', () => {
    const onFileSelected = vi.fn()
    render(<FileUploader onFileSelected={onFileSelected} />)

    const dropZone = screen.getByTestId('file-uploader')
    const file = new File(['test content'], 'questions.csv', {
      type: 'text/csv',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    expect(screen.getByText('questions.csv')).toBeInTheDocument()
  })

  it('shows placeholder text initially', () => {
    render(<FileUploader onFileSelected={vi.fn()} />)
    expect(
      screen.getByText(/Sleep een bestand hierheen/)
    ).toBeInTheDocument()
  })
})
