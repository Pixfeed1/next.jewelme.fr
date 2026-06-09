'use client';
import Script from 'next/script';

const BREVO_CLIENT_KEY = 'wmchthxwmnu4dewmpaw8w';

export default function BrevoChat() {
  return (
    <>
      <Script
        id="brevo-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.Brevo = window.Brevo || [];
            Brevo.push([
              "init",
              { client_key: "${BREVO_CLIENT_KEY}", email_id: "" }
            ]);
          `,
        }}
      />
      <Script
        src="https://cdn.brevo.com/js/sdk-loader.js"
        strategy="afterInteractive"
      />
    </>
  );
}
