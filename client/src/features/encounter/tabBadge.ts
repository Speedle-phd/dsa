import type { TabAttention } from './fightCallout'

// The app icon in the browser tab with a coloured dot while the fight needs the viewer (user request, Nov 2026):
// red for a defense, amber for the own turn. null restores the plain icon.
const plainIcon = '/favicon.svg'
const size = 64
let image: HTMLImageElement | null = null

function iconLink() {
   return document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
}

// The browser's tab bar is not themed: bright signal colours that stand out on the green icon at 16 px
const badgeColors = { defend: '#dc2626', turn: '#f59e0b' } as const

function loadIcon() {
   if (image?.complete) return Promise.resolve(image)
   image = new Image()
   image.src = plainIcon
   return new Promise<HTMLImageElement>((resolve, reject) => {
      image!.onload = () => resolve(image!)
      image!.onerror = reject
   })
}

export async function setTabBadge(attention: TabAttention | null) {
   const link = iconLink()
   if (!link) return
   if (!attention) {
      link.type = 'image/svg+xml'
      link.href = plainIcon
      return
   }
   try {
      const icon = await loadIcon()
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(icon, 0, 0, size, size)
      // Dot at the top right with a white ring, so it stands out on light and dark tab bars
      context.beginPath()
      context.arc(size - 17, 17, 15, 0, Math.PI * 2)
      context.fillStyle = badgeColors[attention]
      context.fill()
      context.lineWidth = 5
      context.strokeStyle = '#ffffff'
      context.stroke()
      link.type = 'image/png'
      link.href = canvas.toDataURL('image/png')
   } catch {
      // Without the icon the tab title still carries the marker
   }
}
