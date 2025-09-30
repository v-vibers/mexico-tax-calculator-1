import type { UserObject, UsageInfo, SubscriptionStatus } from '@subscribe.dev/react'

type HeaderProps = {
  user: UserObject | null
  usage: UsageInfo | null
  subscriptionStatus: SubscriptionStatus | null
  subscribe: (() => void) | null
  signOut: () => void
}

function Header({ user, usage, subscriptionStatus, subscribe, signOut }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-logo">🇲🇽 Mexico Tax Calculator</h1>
        </div>

        <div className="header-right">
          <div className="usage-info">
            <div className="usage-item">
              <span className="usage-label">Credits:</span>
              <span className="usage-value">{usage?.remainingCredits ?? 0}</span>
            </div>
            <div className="usage-item">
              <span className="usage-label">Plan:</span>
              <span className="usage-value">{subscriptionStatus?.plan?.name ?? 'Free'}</span>
            </div>
          </div>

          {subscribe && (
            <button onClick={subscribe} className="manage-subscription-button">
              Manage Subscription
            </button>
          )}

          <div className="user-menu">
            <div className="user-info">
              {user?.avatarUrl && (
                <img src={user.avatarUrl} alt="User avatar" className="user-avatar" />
              )}
              <span className="user-email">{user?.email}</span>
            </div>
            <button onClick={signOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header