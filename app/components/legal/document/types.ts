export interface LegalDocumentSection {
  title: string
  paragraphs: readonly string[]
}

export interface LegalDocumentProps {
  title: string
  updated: string
  intro?: string
  sections: readonly LegalDocumentSection[]
}
