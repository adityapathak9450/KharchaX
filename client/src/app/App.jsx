import { AuthBootstrap } from '../components/auth/AuthBootstrap.jsx'
import { AppRouter } from '../routes/index.jsx'

export default function App() {
  return (
    <AuthBootstrap>
      <AppRouter />
    </AuthBootstrap>
  )
}
