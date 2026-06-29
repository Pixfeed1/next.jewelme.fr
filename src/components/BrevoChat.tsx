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
          (function(d, w, c) {
            w.BrevoConversationsID = '${BREVO_CLIENT_KEY}';
            w[c] = w[c] || function() { (w[c].q = w[c].q || []).push(arguments); };
            var s = d.createElement('script');
            s.async = true;
            s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
            if (d.head) d.head.appendChild(s);
          })(document, window, 'BrevoConversations');
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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M12 3C6.48 3 2 6.7 2 11.25c0 2.36 1.21 4.49 3.15 5.98-.13 1.1-.6 2.55-1.6 3.77 1.86-.27 3.5-1.02 4.7-1.86 1.16.36 2.42.56 3.75.56 5.52 0 10-3.7 10-8.45S17.52 3 12 3z"
            fill="currentColor"
          />
          <circle cx="8" cy="11.25" r="1.3" fill="#ffffff" />
          <circle cx="12" cy="11.25" r="1.3" fill="#ffffff" />
          <circle cx="16" cy="11.25" r="1.3" fill="#ffffff" />
        </svg>
      </button>
    </>
  );
}
