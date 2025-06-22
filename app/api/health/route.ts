/**
 * Health Check API Endpoint
 * Verifies server status and dependencies
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('🏥 Health check started...')
    
    const checks = {
      server: { status: 'ok', timestamp: new Date().toISOString() },
      sharp: { status: 'unknown' as string, version: null as string | null, error: null as string | null },
      auth: { status: 'unknown' as string, error: null as string | null },
      database: { status: 'unknown' as string, error: null as string | null }
    }

    // Test Sharp library
    try {
      const sharp = await import('sharp')
      checks.sharp = {
        status: 'ok',
        version: sharp.default().constructor.name,
        error: null
      }
      console.log('✅ Sharp library loaded successfully')
    } catch (sharpError) {
      checks.sharp = {
        status: 'error',
        version: null,
        error: sharpError instanceof Error ? sharpError.message : 'Unknown Sharp error'
      }
      console.error('❌ Sharp library error:', sharpError)
    }

    // Test Auth (basic import check)
    try {
      await import('@/lib/auth')
      checks.auth = { status: 'ok', error: null }
      console.log('✅ Auth module loaded successfully')
    } catch (authError) {
      checks.auth = {
        status: 'error',
        error: authError instanceof Error ? authError.message : 'Unknown auth error'
      }
      console.error('❌ Auth module error:', authError)
    }

    // Test Database connection
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase')
      const supabase = createServerSupabaseClient()
      
      // Simple test query (this will work even in demo mode)
      const testResult = await supabase.from('carousel_projects').select('count').limit(1)
      
      checks.database = {
        status: testResult.error ? 'error' : 'ok',
        error: testResult.error?.message || null
      }
      
      if (testResult.error) {
        console.log('⚠️ Database connection issue (may be demo mode):', testResult.error.message)
      } else {
        console.log('✅ Database connection successful')
      }
    } catch (dbError) {
      checks.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
      console.error('❌ Database error:', dbError)
    }

    const responseTime = Date.now() - startTime
    const overallStatus = Object.values(checks).every(check => check.status === 'ok') ? 'healthy' : 'degraded'

    console.log(`🏥 Health check completed in ${responseTime}ms - Status: ${overallStatus}`)

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks,
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    })

  } catch (error) {
    console.error('💥 Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
} 