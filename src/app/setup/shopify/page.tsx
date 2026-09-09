'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SetupContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const scope = searchParams.get('scope')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Shopify Connection Setup</h1>
          <p className="text-muted-foreground text-sm">
            One-time setup to connect your Shopify store
          </p>
        </div>

        {success ? (
          <div className="rounded-lg border border-green-600/30 bg-green-600/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-lg">
                ✓
              </div>
              <div>
                <h2 className="font-semibold text-green-600">Connected Successfully!</h2>
                <p className="text-sm text-muted-foreground">
                  Scope: {scope || 'read_orders'}
                </p>
              </div>
            </div>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>Your Shopify access token has been saved to <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.local</code></p>
              <p className="font-medium text-foreground">
                ⚠️ Please restart your dev server (Ctrl+C → npm run dev) for the token to take effect.
              </p>
            </div>
            <a
              href="/"
              className="inline-block w-full text-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold">Before you connect:</h2>
              <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                <li>
                  Open your <strong>.env.local</strong> file and paste your{' '}
                  <strong>Client Secret</strong> from the Shopify Dev Dashboard
                </li>
                <li>
                  In the Shopify Dev Dashboard, add this <strong>redirect URL</strong> to your app:
                  <code className="block mt-1 bg-muted px-2 py-1 rounded text-xs break-all">
                    http://localhost:3000/api/auth/shopify/callback
                  </code>
                </li>
                <li>Restart your dev server after updating .env.local</li>
              </ol>
            </div>

            <a
              href="/api/auth/shopify"
              className="inline-block w-full text-center rounded-md bg-[#008060] text-white px-4 py-3 text-sm font-medium hover:bg-[#006e52] transition-colors"
            >
              🔗 Connect to Shopify
            </a>

            <p className="text-xs text-muted-foreground text-center">
              This will redirect you to Shopify to authorize the app.
              Your access token will be saved automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShopifySetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SetupContent />
    </Suspense>
  )
}
