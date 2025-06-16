import { create } from "zustand"
import type { CarouselProject, Slide, BrandVoiceTemplate } from "./types"

interface AppState {
  // Projects
  projects: CarouselProject[]
  currentProject: CarouselProject | null

  // Slides
  slides: Slide[]
  currentSlide: Slide | null

  // Templates
  templates: BrandVoiceTemplate[]
  selectedTemplate: BrandVoiceTemplate | null

  // UI State
  isAutoSaving: boolean
  lastSaved: Date | null

  // Actions
  setProjects: (projects: CarouselProject[]) => void
  setCurrentProject: (project: CarouselProject | null) => void
  addProject: (project: CarouselProject) => void
  updateProject: (id: string, updates: Partial<CarouselProject>) => void
  deleteProject: (id: string) => void

  setSlides: (slides: Slide[]) => void
  setCurrentSlide: (slide: Slide | null) => void
  addSlide: (slide: Slide) => void
  updateSlide: (id: string, updates: Partial<Slide>) => void
  deleteSlide: (id: string) => void
  reorderSlides: (slides: Slide[]) => void

  setTemplates: (templates: BrandVoiceTemplate[]) => void
  setSelectedTemplate: (template: BrandVoiceTemplate | null) => void

  setAutoSaving: (saving: boolean) => void
  setLastSaved: (date: Date) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  slides: [],
  currentSlide: null,
  templates: [],
  selectedTemplate: null,
  isAutoSaving: false,
  lastSaved: null,

  // Project actions
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject,
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),

  // Slide actions
  setSlides: (slides) => set({ slides }),
  setCurrentSlide: (slide) => set({ currentSlide: slide }),
  addSlide: (slide) =>
    set((state) => ({
      slides: [...state.slides, slide],
    })),
  updateSlide: (id, updates) =>
    set((state) => ({
      slides: state.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      currentSlide: state.currentSlide?.id === id ? { ...state.currentSlide, ...updates } : state.currentSlide,
    })),
  deleteSlide: (id) =>
    set((state) => ({
      slides: state.slides.filter((s) => s.id !== id),
      currentSlide: state.currentSlide?.id === id ? null : state.currentSlide,
    })),
  reorderSlides: (slides) => set({ slides }),

  // Template actions
  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // UI actions
  setAutoSaving: (saving) => set({ isAutoSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
}))
