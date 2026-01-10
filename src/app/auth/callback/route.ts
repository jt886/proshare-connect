import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/home'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const host = request.headers.get('host')
            const isLocal = host?.includes('localhost') || host?.includes('192.168.') || host?.includes('10.')
            const protocol = isLocal ? 'http' : 'https'
            const redirectOrigin = host ? `${protocol}://${host}` : origin

            console.log("AUTH CALLBACK: Redirecting to:", `${redirectOrigin}${next}`);
            return NextResponse.redirect(`${redirectOrigin}${next}`)
        }
    }

    // return the user to an error page with instructions
    const host = request.headers.get('host')
    const isLocal = host?.includes('localhost') || host?.includes('192.168.')
    const protocol = isLocal ? 'http' : 'https'
    const errorOrigin = host ? `${protocol}://${host}` : origin
    return NextResponse.redirect(`${errorOrigin}/auth/auth-code-error`)
}
