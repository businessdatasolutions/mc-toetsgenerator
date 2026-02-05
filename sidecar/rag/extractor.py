from dataclasses import dataclass

import docx
import pdfplumber


@dataclass
class PageText:
    page_number: int
    text: str


def extract_pdf(file_bytes: bytes) -> list[PageText]:
    """Extract text per page from a PDF file."""
    pages: list[PageText] = []
    with pdfplumber.open(file_bytes) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append(PageText(page_number=i + 1, text=text))
    return pages


def extract_docx(file_bytes: bytes) -> str:
    """Extract all text from a DOCX file."""
    import io

    doc = docx.Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def extract_text(
    file_bytes: bytes, mime_type: str
) -> str | list[PageText]:
    """Dispatch to the correct extractor based on mime type."""
    if mime_type in ("application/pdf", "pdf"):
        return extract_pdf(file_bytes)
    elif mime_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx",
    ):
        return extract_docx(file_bytes)
    elif mime_type in ("text/plain", "txt"):
        return file_bytes.decode("utf-8")
    else:
        raise ValueError(f"Unsupported mime type: {mime_type}")
