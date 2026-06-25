'use client';
import Script from 'next/script';

// Client key Brevo Conversations
const BREVO_CLIENT_KEY = 'wmchthxwmnu4dewmpaw8w';

export default function BrevoChat() {
  return (
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
  );
}
