import Link from 'next/link';

import workspaceStyles from '../styles/workspace-page.module.css';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'app', label: 'App', href: '/app?symbol=BTC' },
  { key: 'explainer', label: 'AI Explainer', href: '/ai-explainer?symbol=BTC' },
  { key: 'history', label: 'Trade History', href: '/trade-history' },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const shellStyles = {
  padding: '1.5rem 1rem 3rem',
};

const frameStyles = {
  width: 'min(1280px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gap: '1.25rem',
};

const headerStyles = {
  padding: '1.15rem',
};

const topbarStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const brandCopyStyles = {
  display: 'grid',
  gap: '0.18rem',
};

const brandTitleStyles = {
  fontFamily: "'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif",
  fontSize: '1.05rem',
  fontWeight: 700,
  letterSpacing: '-0.04em',
};

const chipRowStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.6rem',
};

const navStyles = {
  display: 'flex',
  gap: '0.6rem',
  marginTop: '1rem',
};

const mainStyles = {
  display: 'grid',
  gap: '1rem',
};

export default function AppWorkspaceShell({ activeNav, children }) {
  return (
    <div className={cx('apt-shell', workspaceStyles.pageShell)} style={shellStyles}>
      <div style={frameStyles}>
        <header className="apt-panel" style={headerStyles}>
          <div style={topbarStyles}>
            <Link href="/" className="apt-brand-lockup">
                <span className="apt-brand-mark apt-display">APT</span>
              <span style={brandCopyStyles}>
                <span className="apt-eyebrow">AI Power Trade</span>
                <span style={brandTitleStyles}>Core Workspace</span>
              </span>
            </Link>

            <div style={chipRowStyles}>
              <span className="apt-chip">Core Surface</span>
              <span className="apt-chip apt-chip-green">Final UI</span>
            </div>
          </div>

          <nav className={workspaceStyles.navLinks} style={navStyles}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cx('apt-nav-link', activeNav === item.key && 'apt-nav-link-active')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className={workspaceStyles.mainContent} style={mainStyles}>
          {children}
        </main>
      </div>
    </div>
  );
}
