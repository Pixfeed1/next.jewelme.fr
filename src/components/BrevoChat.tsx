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
        <span className="orp-chat-fab-label">Envoyez nous un message</span>
      </button>
    </>
  );
}
