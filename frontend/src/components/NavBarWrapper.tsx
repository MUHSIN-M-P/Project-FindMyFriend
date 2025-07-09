'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; // Your actual Navbar component (can be server component)

export default function NavbarWrapper() {
  const pathname = usePathname();
  return <Navbar currentPath={pathname} />;
}