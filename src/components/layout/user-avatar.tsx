import { initials } from '@/components/layout/shell-user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/** 32px avatar with an initials fallback (Content Guidelines §5.3). */
export function UserAvatar({
  name,
  src,
}: {
  name: string
  src?: string | null
}) {
  return (
    <Avatar className="size-8">
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
