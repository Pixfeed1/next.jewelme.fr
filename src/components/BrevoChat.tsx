'use client';
import Script from 'next/script';

// Client key Brevo Conversations
const BREVO_CLIENT_KEY = 'wmchthxwmnu4dewmpaw8w';

function openBrevoChat() {
  const w = window as any;
  // Essayer plusieurs syntaxes API selon version du SDK Brevo
  if (typeof w.BrevoConversations === 'function') {
    w.BrevoConversations('openChat', true);
    return;
  }
  if (w.BrevoConversations && typeof w.BrevoConversations.openChat === 'function') {
    w.BrevoConversations.openChat();
    return;
  }
  if (w.Brevo && typeof w.Brevo.push === 'function') {
    w.Brevo.push(['openChat']);
    return;
  }
  // Fallback : trouver et cliquer le bouton natif (s'il existe dans le DOM)
  const launcher = document.querySelector(
    '#brevo-conversations-icon, #brevo-conversations > button, [class*="conversations-icon"], iframe[id*="brevo-conversations-launcher"]'
  ) as HTMLElement | null;
  if (launcher) {
    launcher.click();
    return;
  }
  console.warn('[chat] Brevo SDK not ready or button not found');
}

export default function BrevoChat() {
  return (
    <>
      <Script
        id="brevo-conversations"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          (function(d, w) {
            w.Brevo = w.Brevo || [];
            w.Brevo.push(['init', { client_key: '${BREVO_CLIENT_KEY}', email_id: '' }]);
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://cdn.brevo.com/js/sdk-loader.js';
            if (d.head) d.head.appendChild(s);
          })(document, window);
        `,
        }}
      />
      {/* Bouton chat flottant independant : toujours visible, se decale au-dessus
          du lecteur audio quand celui-ci est ouvert (body.orp-player-active). */}
      <button
        className="orp-chat-fab"
        type="button"
        onClick={openBrevoChat}
        title="Discuter avec nous"
        aria-label="Discuter avec nous"
      >
        <svg className="orp-chat-fab-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H10l-4 3.5V16H5.5C4.67 16 4 15.33 4 14.5v-9z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className="orp-chat-fab-full">Envoyez-nous un message</span>
        <span className="orp-chat-fab-short">Message</span>
      </button>
    </>
  );
}
