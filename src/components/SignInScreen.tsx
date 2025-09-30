import { useSubscribeDev } from '@subscribe.dev/react'

function SignInScreen() {
  const { signIn } = useSubscribeDev()

  return (
    <div className="sign-in-container">
      <div className="sign-in-card">
        <h1 className="sign-in-title">Mexico Tax Calculator</h1>
        <p className="sign-in-description">
          AI-powered tax calculator for Mexico. Calculate your taxes based on Mexican tax laws with intelligent assistance.
        </p>
        <div className="sign-in-features">
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span>Accurate tax calculations</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI-powered assistance</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🇲🇽</span>
            <span>Mexican tax law compliance</span>
          </div>
        </div>
        <button onClick={signIn} className="sign-in-button">
          Sign In to Get Started
        </button>
      </div>
    </div>
  )
}

export default SignInScreen