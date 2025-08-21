
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import 'react-perfect-scrollbar/dist/css/styles.css'
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'
import { i18n } from '@configs/i18n'
import { getSystemMode } from '@core/utils/serverHelpers'
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthChecker } from '@/components/Authchecker'
export const metadata = {
    title: 'Maran Residency',
    description: 'Admin panel',
    icons: {
        icon: '/favicon.ico',
    },
}
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RootLayout = async (props: ChildrenType & { params: Promise<{ lang: Locale }> }) => {
    const params = await props.params
    const { children } = props
    const systemMode = await getSystemMode()
    const direction = i18n.langDirection[params.lang]

    return (
        <html id='__next' lang={params.lang} dir={direction} suppressHydrationWarning>
            <head>
                {/* Add this if you want the loader to work during SSR */}
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2.0/nprogress.min.css" />
                <link rel="icon" href="./favicon.ico" sizes="any" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            </head>
            <body className='flex is-full min-bs-full flex-auto flex-col'>
                <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
                <AuthProvider>
                    <AuthChecker>
                        {children}
                    </AuthChecker>
                </AuthProvider>
            </body>
        </html>
    )
}

export default RootLayout
