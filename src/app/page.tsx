import { redirect } from 'next/navigation'

// App Flow: no public landing page. The middleware sends signed-in users to
// their home; everyone else lands here and goes to /login.
export default function RootPage() {
  redirect('/login')
}
