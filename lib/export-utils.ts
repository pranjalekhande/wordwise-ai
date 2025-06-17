/**
 * Document Export Utilities
 * Provides various export formats for documents
 */

import type { Document } from './types'

/**
 * Export document as plain text file
 * No external packages required
 */
export const exportAsText = (doc: Document) => {
  const content = `${doc.title}\n\n${doc.content}`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${doc.title}.txt`
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export document as Markdown file
 * No external packages required
 */
export const exportAsMarkdown = (doc: Document) => {
  const content = `# ${doc.title}\n\n${doc.content}`
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${doc.title}.md`
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export document as HTML file
 * No external packages required
 */
export const exportAsHTML = (doc: Document) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .content { line-height: 1.6; white-space: pre-wrap; }
        .meta { color: #666; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <h1>${doc.title}</h1>
    <div class="content">${doc.content}</div>
    <div class="meta">
        <p>Word count: ${doc.word_count} | Character count: ${doc.char_count}</p>
        <p>Created: ${new Date(doc.created_at).toLocaleDateString()}</p>
        <p>Last updated: ${new Date(doc.updated_at).toLocaleDateString()}</p>
    </div>
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${doc.title}.html`
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generic export function that handles multiple formats
 * Currently supports: txt, md, html
 * For PDF/DOCX support, install: npm install jspdf docx
 */
export const exportDocument = (doc: Document, format: 'txt' | 'md' | 'html') => {
  switch (format) {
    case 'txt':
      exportAsText(doc)
      break
    case 'md':
      exportAsMarkdown(doc)
      break
    case 'html':
      exportAsHTML(doc)
      break
    default:
      exportAsText(doc)
  }
} 