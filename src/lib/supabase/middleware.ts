import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request and writes the
 * refreshed cookies onto the response. This is the ONLY job of the proxy —
 * route protection is handled in the layouts (account/layout.tsx,
 * admin/layout.tsx), not here.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // No-op until the Supabase project is created and env vars are set.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set({ name, value })
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              supabaseResponse.cookies.set(name, value, options)
            } else {
              supabaseResponse.cookies.set(name, value)
            }
          })
        },
      },
    }
  )

  // IMPORTANT: refresh the session. Do not run other logic between
  // createServerClient and getUser().
  await supabase.auth.getUser()

  return supabaseResponse
}
