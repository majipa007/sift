interface StatusBannerProps {
  title: string
  message: string
  alert?: boolean
}

export function StatusBanner({ title, message, alert = false }: StatusBannerProps) {
  return (
    <div className={`inline-banner${alert ? ' inline-banner-alert' : ''}`}>
      <p className="section-label">{title}</p>
      <p>{message}</p>
    </div>
  )
}
