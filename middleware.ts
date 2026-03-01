export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/feeds/:path*',
    '/article/:path*',
    '/saved/:path*',
    '/settings/:path*',
  ],
}
