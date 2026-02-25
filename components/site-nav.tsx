'use client';

import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/details', label: 'Details' },
  { href: '/settings', label: 'Settings' },
];

export function SiteNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="nav-list">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <a href={link.href} className={active ? 'nav-link active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
