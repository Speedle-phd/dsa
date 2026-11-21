import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Page title with an icon tile and a lead line (after chore_app's PageHeader); actions go below on every width.
export function PageHeading({ Icon, title, description, children }: {
   Icon: LucideIcon; title: string; description?: ReactNode; children?: ReactNode
}) {
   return <div className='page-heading'>
      <div className='page-title'>
         <span className='page-icon' aria-hidden='true'><Icon size={24} /></span>
         <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
         </div>
      </div>
      {children}
   </div>
}
