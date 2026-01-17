import { Link } from "react-router-dom";
import { 
  Twitter, 
  Github, 
  MessageCircle, 
  Youtube, 
  Linkedin,
  Mail 
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: MessageCircle, href: "#", label: "Discord" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  const footerLinks = {
    product: [
      { label: "Whitepaper", href: "/whitepaper" },
      { label: "Wallet", href: "/wallet" },
      { label: "Ambassador", href: "/ambassador" },
    ],
    legal: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
    support: [
      { label: "FAQ", href: "#" },
      { label: "Contact", href: "#" },
    ],
  };

  return (
    <footer className="relative border-t border-border bg-midnight-dark/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center glow-gold-sm">
                <span className="font-display font-bold text-midnight text-lg">V</span>
              </div>
              <span className="font-display font-bold text-xl text-gradient-gold">
                VAGS
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Virtual Asset Gold & Silver — The sustainable digital metal standard for the next century.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Stay Updated</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe to receive the latest updates and announcements.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              <button className="px-4 py-2.5 rounded-lg bg-gradient-gold text-midnight font-medium text-sm hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} VAGS. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Backed by 216,265 tonnes of gold & 1.74M metric tons of silver
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
