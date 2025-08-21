// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// HOC Imports


const Layout = async (props: ChildrenType & { params: Promise<{ lang: Locale }> }) => {


  const { children } = props

  return <>{children}</>
}

export default Layout
