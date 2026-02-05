export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-2xl font-bold text-primary">
        <span className="text-primary">VITOLUX</span>
        <span className="text-secondary text-lg">UA</span>
      </div>
      <svg
        className="w-8 h-8 text-secondary"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13 3L4 14h7v7l9-11h-7V3z" />
      </svg>
    </div>
  )
}
