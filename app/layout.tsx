import type { Metadata } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayReality | AI SecureWatch",
  description: "Verifiable Intent Certificates for AI Financial Decisions. The layer of financial reality you have never seen.",
  openGraph: {
    title: "PayReality | AI SecureWatch",
    description: "Verifiable Intent Certificates for AI Financial Decisions. Two files in. One complete picture out.",
    siteName: "PayReality",
    images: [{ url: "/og-image.jpg" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayReality | AI SecureWatch",
    description: "Verifiable Intent Certificates for AI Financial Decisions.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-body)]">

        <svg className="hidden" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <g id="icon-eye">
                <path d="M854.35.01l42.66,3.02c358.52,31.7,669.05,301,742.73,663.38l3.25,19.26v34.13c-1.34,5.98-1.95,12.11-3.42,18.08-24.61,100.06-146.48,139.88-227.39,81.12-58.67-42.6-54.42-93.91-73.98-157.19-71.22-230.41-273.72-366.45-506.93-369.63-246.47-3.36-462.98,142.48-531.6,388.47-14.54,52.14-13.75,105.13-69.79,130.36-71.29,32.1-198.85,2.84-224.49-81.16-2.23-7.28-2.62-15.28-5.38-22.1v-20.08c1.41-1.2,1.55-2.95,1.84-4.64C66.47,300.04,412.69,11.66,789.21,1.05l2.37-1.05h62.78ZM796.28,34.45C457.94,44.42,148.04,277.62,52.48,611.4c-8.34,29.13-23.74,79.18-15.14,107.86,18.65,62.22,115.25,80,168.64,64.3,48.54-14.26,47.36-58.34,58.16-100.1,69.34-268.15,300.6-428.95,568.11-425.39,252.48,3.36,469.69,154.74,541.49,405.53,12.95,45.22,11.81,87.31,49.02,120.49,64.74,57.73,174.66,22.19,186.75-66.93,4.07-29.98-8.63-74.3-17.03-103.76C1497.53,280.27,1184.73,41.29,846.06,34.11l-49.78.33h0Z"/>
                <path d="M853.37,1250.87h-58.85c-229.12-18.7-387.65-232.7-344.97-464.99,7.41-40.33,29.13-103.11,54.21-135.25,10.02-12.85,25.52-16.45,36.23-2.11,12.27,16.43-3.6,31.09-11.11,44.89-120.9,221.98,23.8,493.64,269.07,513.29,96.86,7.76,204.85-31.49,269.74-106.39,11.97-13.82,29.62-48.12,51.98-31.13,21.71,16.5-3.47,42.6-15.68,56.23-62.97,70.31-156.85,119.55-250.63,125.48Z"/>
            </g>
            <g id="icon-database">
                <path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 3c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3zm0 14c-4.42 0-8-1.34-8-3v-2.19c1.94 1.34 4.76 2.19 8 2.19s6.06-.85 8-2.19V17c0 1.66-3.58 3-8 3z"/>
            </g>
            <g id="icon-shield-lock">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3v1h1v5H8v-5h1v-1c0-1.66 1.34-3 3-3zm0 2c-.55 0-1 .45-1 1v1h2v-1c0-.55-.45-1-1-1z"/>
            </g>
            <g id="icon-scan-network">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-1.46-1.92-2.35-4.34-2.35-7.4C2 6.48 6.48 2 12 2s10 4.48 10 10c0 3.06-.89 5.48-2.35 7.4l-0.62-1.79C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 4c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
            </g>
            <g id="icon-entity-map">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </g>
            <g id="icon-audit-trail">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </g>
          </defs>
        </svg>
        <div id="global-brand-preloader" className="fixed inset-0 z-[999999] bg-[var(--bg-base)] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out">
          <div className="relative flex flex-col items-center">
            <div className="relative overflow-hidden inline-block animate-hash-glitch">
              <span className="font-body font-extrabold text-6xl tracking-tight text-[var(--text-primary)]">PayReality</span>
            </div>
            <div className="font-mono text-xs text-[#D94028] tracking-[0.2em] mt-2 relative overflow-hidden px-4 py-1">
              <span className="animate-pulse">VERIFIABLE_INTENT_CERTIFICATE // SECURE_INIT</span>
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#D94028] shadow-[0_0_15px_3px_rgba(217,64,40,0.9)] animate-[scanSweep_2.5s_ease-in-out_infinite_alternate] z-10" style={{ animationName: 'scanSweepHorizontal' }}></div>
            </div>
          </div>
          <div className="mt-8 font-mono text-[11px] text-[#9CA3AF] text-center tracking-[0.1em]">
            <span className="text-[#D94028] font-bold">&gt; GATING_DOM_RENDER</span><br/>
            <span className="text-[9px] opacity-60">SYSTEM_INGESTION_ACTIVE</span>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'light') {
                  document.documentElement.classList.add('light');
                }
              } catch (_) {}
              window.addEventListener('load', function() {
                var preloader = document.getElementById('global-brand-preloader');
                if (preloader) {
                  preloader.style.opacity = '0';
                  setTimeout(function() { preloader.remove(); }, 700);
                }
              });
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
