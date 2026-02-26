'use client';

import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/details', label: 'Details' },
  { href: '/settings', label: 'Settings' },
];

export function SiteNav(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  const onNavigate = (event: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    router.push(href);
  };

  return (
    <nav aria-label="Primary">
      <ul className="nav-list">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <a
                href={link.href}
                className={active ? 'nav-link active' : 'nav-link'}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => onNavigate(event, link.href)}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
