"use client"

import { SignUp } from "@clerk/nextjs"
import { ArrowRight, Edit, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function SignUpPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Set document title on client side
  useEffect(() => {
    document.title = "Create Account - WordWise AI"
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-900 rounded-lg flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-900">WordWise AI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features">
                <Button variant="ghost" className="text-stone-600 hover:text-amber-900">
                  Features
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button variant="ghost" className="text-stone-600 hover:text-amber-900">
                  How it works
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50">
                  Sign in
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
                <Link href="/#features">
                  <Button variant="ghost" className="justify-start text-stone-600 hover:text-amber-900">
                    Features
                  </Button>
                </Link>
                <Link href="/#how-it-works">
                  <Button variant="ghost" className="justify-start text-stone-600 hover:text-amber-900">
                    How it works
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" className="justify-start border-stone-300 text-stone-700 hover:bg-stone-50">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content - Split Layout */}
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Half - Landing Page Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 py-12 bg-white">
          <div className="max-w-lg mx-auto lg:mx-0">
            {/* Main Headline */}
            <h1 className="text-3xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight">
              Start creating better content with AI
            </h1>
            
            {/* Description */}
            <p className="text-xl text-stone-600 mb-8 leading-relaxed">
              Join thousands of creators using WordWise AI to write better, create Instagram carousels, and produce compelling content faster.
            </p>

            {/* Key Benefits */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-stone-700">Free to start, no credit card required</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-stone-700">5 documents included in free plan</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-stone-700">AI-powered writing assistance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span className="text-stone-700">Create Instagram carousels instantly</span>
              </div>
            </div>

            {/* Sign in link */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 lg:hidden">
              <p className="text-stone-600">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-amber-900 hover:text-amber-800 font-medium underline">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Trust indicators */}
            <p className="text-sm text-stone-500">
              Trusted by creators worldwide • Join 10,000+ users • Start in 30 seconds
            </p>
          </div>
        </div>

        {/* Right Half - Sign Up Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 bg-amber-50 lg:border-l border-stone-200">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mb-2">Create your account</h2>
              <p className="text-stone-600">Start your WordWise AI journey today</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-amber-900 hover:bg-amber-800 text-white border-amber-900",
                    card: "shadow-none border-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border-stone-200 hover:bg-stone-50 text-stone-700",
                    dividerLine: "bg-stone-200",
                    dividerText: "text-stone-500",
                    formFieldInput: "border-stone-200 focus:border-amber-900 focus:ring-amber-900",
                    footerActionLink: "text-amber-900 hover:text-amber-800",
                  }
                }}
                redirectUrl="/"
              />
            </div>

            {/* Mobile sign in link */}
            <div className="text-center mt-6 lg:hidden">
              <p className="text-sm text-stone-600">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-amber-900 hover:text-amber-800 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
