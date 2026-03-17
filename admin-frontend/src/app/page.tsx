import { redirect } from 'next/navigation';

/**
 * Root route: Redirect to dashboard. Auth guard is handled by
 * Next.js middleware and the (dashboard) layout.
 */
export default function RootPage() {
  redirect('/dashboard');
}
