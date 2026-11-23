import { Link } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <img src={logoMark} alt="Teezo" className="h-12 w-12" />
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          That fairway does not exist — or the pin was moved. Head back to Teezo home.
        </p>
      </div>
      <Link to="/">
        <Button type="button">Back to Teezo</Button>
      </Link>
    </div>
  )
}
