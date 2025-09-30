import { useSubscribeDev } from '@subscribe.dev/react'
import './App.css'
import SignInScreen from './components/SignInScreen'
import TaxCalculator from './components/TaxCalculator'

function App() {
  const { isSignedIn } = useSubscribeDev()

  if (!isSignedIn) {
    return <SignInScreen />
  }

  return <TaxCalculator />
}

export default App
