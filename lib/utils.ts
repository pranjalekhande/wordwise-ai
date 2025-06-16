import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ReadabilityScore } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateReadabilityScore(text: string): ReadabilityScore {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word)
  }, 0)

  if (sentences.length === 0 || words.length === 0) {
    return { score: 0, level: "N/A", suggestions: [] }
  }

  // Flesch Reading Ease Score
  const avgSentenceLength = words.length / sentences.length
  const avgSyllablesPerWord = syllables / words.length
  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord

  let level: string
  const suggestions: string[] = []

  if (score >= 90) {
    level = "Very Easy"
  } else if (score >= 80) {
    level = "Easy"
  } else if (score >= 70) {
    level = "Fairly Easy"
  } else if (score >= 60) {
    level = "Standard"
    suggestions.push("Consider shorter sentences for better engagement")
  } else if (score >= 50) {
    level = "Fairly Difficult"
    suggestions.push("Simplify complex words", "Break up long sentences")
  } else {
    level = "Difficult"
    suggestions.push("Use simpler vocabulary", "Shorten sentences significantly")
  }

  return { score: Math.max(0, Math.min(100, score)), level, suggestions }
}

function countSyllables(word: string): number {
  word = word.toLowerCase()
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
  word = word.replace(/^y/, "")
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
