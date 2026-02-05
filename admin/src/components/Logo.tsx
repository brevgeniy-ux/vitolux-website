export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-xl font-bold text-primary">
        <span>VITOLUX</span>
        <span className="text-secondary text-sm">UA</span>
      </div>
      <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 3L4 14h7v7l9-11h-7V3z" />
      </svg>
    </div>
  )
}
