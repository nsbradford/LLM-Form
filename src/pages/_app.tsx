import GoogleAnalytics from '@/components/GoogleAnalytics';
import { PostHogScript } from '@/components/posthog';
import '@/styles/globals.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import { useState } from 'react';
import Head from 'next/head';
config.autoAddCss = false;

const isProduction = process.env.NODE_ENV === 'production';
const isProduction = process.env.NODE_ENV === 'production';

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());
  return (
    <>
      <Head>
        <title>TalkForm AI</title>
      </Head>

      <GoogleAnalytics
        GA_TRACKING_ID={process.env.NEXT_PUBLIC_GA_TRACKING_ID}
      />
      <PostHogScript
        POSTHOG_API_KEY={process.env.NEXT_PUBLIC_POSTHOG_API_KEY}
      />
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
        <Component {...pageProps} />
        <Analytics />
      </SessionContextProvider>
    </>
  );
}
