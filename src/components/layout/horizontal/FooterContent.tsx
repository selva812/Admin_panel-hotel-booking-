'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()}, Made`}</span>
        <span className='text-textSecondary'>{` by`}</span>
        <Link href='https://intelixent.com/' target='_blank' className='text-primary uppercase'>
          Intelixent it solutions
        </Link>
      </p>

    </div>
  )
}

export default FooterContent
