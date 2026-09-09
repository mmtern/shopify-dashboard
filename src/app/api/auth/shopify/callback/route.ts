import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')

  // Verify nonce to prevent CSRF
  const storedNonce = request.cookies.get('shopify_oauth_state')?.value
  if (!state || state !== storedNonce) {
    return new NextResponse(
      'Invalid state parameter. Please go back to /setup/shopify and try again.',
      { status: 403 }
    )
  }

  if (!code || !shop) {
    return new NextResponse('Missing authorization code or shop.', { status: 400 })
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    const data = await tokenRes.json()

    if (!data.access_token) {
      console.error('Shopify token exchange failed:', data)
      return new NextResponse(
        `Failed to get access token from Shopify. Response: ${JSON.stringify(data)}`,
        { status: 500 }
      )
    }

    // Save the access token to .env.local
    const envPath = path.resolve(process.cwd(), '.env.local')
    let envContent = fs.readFileSync(envPath, 'utf-8')

    if (envContent.includes('SHOPIFY_ACCESS_TOKEN=')) {
      envContent = envContent.replace(
        /SHOPIFY_ACCESS_TOKEN=.*/,
        `SHOPIFY_ACCESS_TOKEN="${data.access_token}"`
      )
    } else {
      envContent += `\nSHOPIFY_ACCESS_TOKEN="${data.access_token}"\n`
    }

    fs.writeFileSync(envPath, envContent)
    console.log('✅ Shopify access token saved to .env.local')

    // Redirect to success page
    const successUrl = new URL('/setup/shopify', request.url)
    successUrl.searchParams.set('success', 'true')
    successUrl.searchParams.set('scope', data.scope || '')

    const response = NextResponse.redirect(successUrl)
    response.cookies.delete('shopify_oauth_state')
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new NextResponse(`OAuth error: ${String(error)}`, { status: 500 })
  }
}
