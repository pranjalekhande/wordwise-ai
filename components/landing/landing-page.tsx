"use client"

import { ArrowRight, FileText, Instagram, Edit, Brain, Sparkles, Users, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

/**
 * Landing Page Component
 * Enhanced design with navigation, warm brown tones, and hero illustration
 * Mobile-first responsive design with professional illustration
 */
export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-900 rounded-lg flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-900">WordWise AI</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-stone-600 hover:text-amber-900 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-stone-600 hover:text-amber-900 transition-colors font-medium">
                How it works
              </a>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-stone-600 hover:text-amber-900 font-medium">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-amber-900 hover:bg-amber-800 text-white font-medium">
                  Get started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-stone-200 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-stone-600 hover:text-amber-900 transition-colors font-medium">
                  Features
                </a>
                <a href="#how-it-works" className="text-stone-600 hover:text-amber-900 transition-colors font-medium">
                  How it works
                </a>
                <Link href="/sign-in">
                  <Button variant="ghost" className="justify-start text-stone-600 hover:text-amber-900 font-medium">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="justify-start bg-amber-900 hover:bg-amber-800 text-white font-medium">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Mobile-First Responsive Design */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Content - Left Side */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-stone-900 mb-6 lg:mb-8 leading-[1.1] tracking-tight">
                AI-powered writing assistant for creators
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-stone-600 mb-8 lg:mb-10 leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
                Transform your documents into polished content. From grammar checking to Instagram carousels — all powered by intelligent AI.
              </p>

              {/* Key Benefits */}
              <div className="space-y-3 lg:space-y-4 mb-8 lg:mb-10 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center space-x-4 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></div>
                  <span className="text-stone-700 text-base lg:text-lg">Real-time grammar & style suggestions</span>
                </div>
                <div className="flex items-center space-x-4 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></div>
                  <span className="text-stone-700 text-base lg:text-lg">Convert documents to social content</span>
                </div>
                <div className="flex items-center space-x-4 justify-center lg:justify-start">
                  <div className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0"></div>
                  <span className="text-stone-700 text-base lg:text-lg">Smart template recommendations</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-amber-900 hover:bg-amber-800 text-white px-8 py-4 text-lg font-medium w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200">
                    Start writing for free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="border-stone-300 text-stone-700 hover:bg-stone-50 px-8 py-4 text-lg font-medium w-full sm:w-auto">
                    Sign in
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <p className="text-stone-500 font-medium text-center lg:text-left">
                Free to start • No credit card required • 5 documents included
              </p>
            </div>

            {/* Illustration - Right Side */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
                <Image
                  src="/hero-illustration.svg"
                  alt="AI-powered writing assistant for creators - Person with laptop creating content"
                  width={600}
                  height={400}
                  priority
                  className="w-full h-auto drop-shadow-2xl"
                />
                
                {/* Decorative floating elements for larger screens */}
                <div className="hidden lg:block absolute -top-4 -right-4 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <div className="hidden lg:block absolute -bottom-6 -left-6 w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                <div className="hidden lg:block absolute top-1/3 -left-8 w-4 h-4 bg-amber-500 rounded-full opacity-60 animate-pulse" style={{animationDelay: '2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight tracking-tight">
              Everything you need to create amazing content
            </h2>
            <p className="text-xl lg:text-2xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-light">
              Powerful AI features designed to enhance your writing and scale your content creation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-stone-200 hover:shadow-xl transition-all duration-300 hover:border-amber-200 group">
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-amber-700 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                  AI Writing Assistant
                </h3>
                <p className="text-stone-600 text-lg leading-relaxed">
                  Smart grammar checking, style suggestions, and readability analysis
                </p>
              </CardContent>
            </Card>

            <Card className="border-stone-200 hover:shadow-xl transition-all duration-300 hover:border-amber-200 group">
              <CardContent className="p-8 text-center">
                <Instagram className="h-12 w-12 text-amber-700 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                  Instagram Carousels
                </h3>
                <p className="text-stone-600 text-lg leading-relaxed">
                  Transform documents into engaging social media content automatically
                </p>
              </CardContent>
            </Card>

            <Card className="border-stone-200 hover:shadow-xl transition-all duration-300 hover:border-amber-200 group">
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-amber-700 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                  Template Intelligence
                </h3>
                <p className="text-stone-600 text-lg leading-relaxed">
                  AI-powered template recommendations that adapt to your content type
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight tracking-tight">
              From idea to content in 3 simple steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                Write or Upload
              </h3>
              <p className="text-stone-600 text-lg leading-relaxed max-w-sm mx-auto">
                Start writing in our editor or upload your existing documents
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                AI Enhancement
              </h3>
              <p className="text-stone-600 text-lg leading-relaxed max-w-sm mx-auto">
                Our AI analyzes and suggests improvements to your content
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold text-stone-900 mb-4 leading-tight">
                Create & Share
              </h3>
              <p className="text-stone-600 text-lg leading-relaxed max-w-sm mx-auto">
                Transform into carousels, export, or share directly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-stone-900 text-stone-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-amber-900 rounded-lg flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">WordWise AI</span>
            </div>
            <div className="flex space-x-8 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-800 text-center">
            <p className="text-stone-500 font-medium">&copy; 2025 Pranjal Ekhande. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 