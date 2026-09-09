import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const shop = process.env.SHOPIFY_STORE
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/shopify/callback`
  const scopes = 'read_orders'

  if (!shop || !clientId) {
    return new NextResponse(
      'Missing SHOPIFY_STORE or SHOPIFY_CLIENT_ID in .env.local',
      { status: 500 }
    )
  }

  // Generate nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString('hex')

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', nonce)

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('shopify_oauth_state', nonce, {
    httpOnly: true,
    secure: false, // false for localhost
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
