import { useCallback, useState } from 'react'

const ACCEPTED_TYPES = ['.csv', '.xlsx', '.docx']

interface FileUploaderProps {
  onFileSelected: (file: File) => void
}

export default function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setSelectedFile(file)
      onFileSelected(file)
    },
    [onFileSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      data-testid="file-uploader"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        id="file-upload"
        data-testid="file-input"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {selectedFile ? (
          <div>
            <p className="font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {formatSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">
              Sleep een bestand hierheen of klik om te selecteren
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Ondersteunde formaten: CSV, XLSX, DOCX
            </p>
          </div>
        )}
      </label>
    </div>
  )
}
