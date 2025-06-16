import type { Document } from "./types"

export function generateUntitledName(existingDocuments: Document[]): string {
  const untitledPattern = /^Untitled( \d+)?$/
  const untitledNumbers: number[] = []

  existingDocuments.forEach((doc) => {
    const match = doc.title.match(untitledPattern)
    if (match) {
      if (match[1]) {
        // "Untitled X" format
        const num = Number.parseInt(match[1].trim())
        untitledNumbers.push(num)
      } else {
        // Just "Untitled"
        untitledNumbers.push(1)
      }
    }
  })

  if (untitledNumbers.length === 0) {
    return "Untitled"
  }

  // Find the next available number
  untitledNumbers.sort((a, b) => a - b)
  let nextNumber = 1

  for (const num of untitledNumbers) {
    if (num === nextNumber) {
      nextNumber++
    } else {
      break
    }
  }

  return nextNumber === 1 ? "Untitled" : `Untitled ${nextNumber}`
}
