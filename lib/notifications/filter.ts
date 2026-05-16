import type { NotificationCategory, NotificationPrefs } from './types'

export function shouldIncludeUser(
  notif: NotificationPrefs | null | undefined,
  category: NotificationCategory,
  isFollower: boolean
): boolean {
  const type = notif?.type ?? 'todas'

  if (type === 'ninguna') return false
  if (type === 'todas') return true

  // type === 'personalizar'
  if (category === 'ranking') {
    return notif?.ranking === true
  }

  const isTournament =
    category === 'tournament_fasgba' || category === 'tournament_club'
  const isFasgbaCategory =
    category === 'news_fasgba' || category === 'tournament_fasgba'
  const subPref = isTournament ? notif?.torneos : notif?.noticias

  switch (subPref) {
    case 'todos':
      return true
    case 'fasgba':
      return isFasgbaCategory
    case 'fasgba-y-clubes':
      return isFasgbaCategory || isFollower
    case 'clubes':
      return !isFasgbaCategory && isFollower
    case 'ninguno':
    default:
      return false
  }
}
