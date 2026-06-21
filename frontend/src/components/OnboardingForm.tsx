import { profileData } from '../mockData'

export function OnboardingForm() {
  return (
    <form className="panel onboarding-form">
      <label>
        <span>Your role</span>
        <input type="text" defaultValue={profileData.role} />
      </label>
      <label>
        <span>What is important to you</span>
        <textarea defaultValue={profileData.important.join('\n')} />
      </label>
      <label>
        <span>What is always junk</span>
        <textarea defaultValue={profileData.junkRules.join('\n')} />
      </label>
      <label>
        <span>Key senders</span>
        <textarea defaultValue={profileData.keySenders.join('\n')} />
      </label>
      <label>
        <span>Default reply tone</span>
        <select defaultValue={profileData.defaultTone}>
          <option value="formal">Formal</option>
          <option value="friendly">Friendly</option>
          <option value="concise">Concise</option>
        </select>
      </label>
      <div className="action-row action-row-left">
        <button type="button">Save Profile</button>
        <button type="button">Reconnect Gmail</button>
      </div>
    </form>
  )
}
