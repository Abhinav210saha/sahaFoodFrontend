export function Footer() {
  const socials = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/sahafood22/",
      icon: (
        <path d="M12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 6.9a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.1-7.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2.9 1c-.1-1-.4-1.8-1.1-2.5S17.4 4.1 16.4 4c-1-.1-4-.1-5.4-.1S6.6 4 5.6 4.1c-1 .1-1.8.4-2.5 1.1S2 6.6 1.9 7.6c-.1 1-.1 4-.1 5.4s0 4.4.1 5.4c.1 1 .4 1.8 1.1 2.5s1.5 1 2.5 1.1c1 .1 4 .1 5.4.1s4.4 0 5.4-.1c1-.1 1.8-.4 2.5-1.1s1-1.5 1.1-2.5c.1-1 .1-4 .1-5.4s0-4.4-.1-5.4ZM18.5 18c-.1.7-.2 1.1-.5 1.4-.3.3-.7.4-1.4.5-.9.1-3.8.1-5.1.1s-4.2 0-5.1-.1c-.7-.1-1.1-.2-1.4-.5-.3-.3-.4-.7-.5-1.4-.1-.9-.1-3.8-.1-5.1s0-4.2.1-5.1c.1-.7.2-1.1.5-1.4.3-.3.7-.4 1.4-.5.9-.1 3.8-.1 5.1-.1s4.2 0 5.1.1c.7.1 1.1.2 1.4.5.3.3.4.7.5 1.4.1.9.1 3.8.1 5.1s0 4.2-.1 5.1Z" />
      ),
    },
    {
      name: "Facebook",
      href: "https://facebook.com/sahafood",
      icon: <path d="M13.6 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.5V4.9c-.3 0-1.1-.1-2.1-.1-2 0-3.4 1.2-3.4 3.5v2h-2.3v2.9h2.3V21h2.6Z" />,
    },
    {
      name: "X",
      href: "https://x.com/sahafood",
      icon: <path d="M18.9 4h-2.7l-3.8 4.4L9.4 4H4l5.8 8.4L4.3 19h2.7l4.1-4.8 3.3 4.8H20l-6-8.8 4.9-5.7Zm-3 13h-1.4L8 5.9h1.4L15.9 17Z" />,
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@sahafood",
      icon: <path d="M20.5 8.1a3 3 0 0 0-2.1-2.1C16.6 5.5 12 5.5 12 5.5s-4.6 0-6.4.5A3 3 0 0 0 3.5 8C3 9.9 3 12 3 12s0 2.1.5 4a3 3 0 0 0 2.1 2.1c1.8.5 6.4.5 6.4.5s4.6 0 6.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-4 .5-4s0-2.1-.5-3.9ZM10.5 14.5V9.5l4.2 2.5-4.2 2.5Z" />,
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/916202173133",
      icon: <path d="M12 2.8a9.2 9.2 0 0 0-7.8 14l-1.3 4.4 4.6-1.2A9.2 9.2 0 1 0 12 2.8Zm0 16.8c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.2-5.7c-.2-.1-1.4-.7-1.6-.7-.2-.1-.3-.1-.5.1l-.7.8c-.1.1-.3.2-.4.1-.2-.1-.8-.3-1.4-.9-.5-.4-.9-1-.9-1.2 0-.2 0-.3.1-.4l.4-.5.2-.4c.1-.1 0-.3 0-.4L10.9 8c-.1-.2-.3-.2-.4-.2h-.4c-.2 0-.4.1-.5.3-.2.2-.7.7-.7 1.8 0 1 .7 2 1 2.3.1.1 1.5 2.4 3.7 3.3.5.2 1 .4 1.3.5.5.2.9.2 1.2.1.4-.1 1.4-.6 1.6-1.2.2-.5.2-1 .2-1.1 0-.1-.1-.2-.3-.3Z" />,
    },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>Saha Food</h3>
          <p>Modern cloud kitchen experience with fast delivery, curated daily offers, and smooth checkout.</p>
          <p className="footer-copy">Open Daily | 11:00 AM - 10:00 PM</p>
        </div>
        <div className="footer-connect">
          <p className="footer-heading">Follow us</p>
          <div className="footer-socials">
            {socials.map((social) => (
              <a key={social.name} href={social.href} target="_blank" rel="noreferrer" aria-label={social.name}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {social.icon}
                </svg>
              </a>
            ))}
          </div>
          <p className="footer-copy">Support WhatsApp: +91 6202173133</p>
        </div>
      </div>
    </footer>
  );
}
