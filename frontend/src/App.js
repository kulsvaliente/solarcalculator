import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import PublicDashLayout from './components/PublicDashLayout'
import LandingPage from './components/LandingPage'
import useTitle from './hooks/useTitle';
import GlobalLoading from './components/GlobalLoading'
import NotFound from './components/NotFound'
import { CalculatorUIProvider } from './features/solar-calculator/context/CalculatorUIContext'

const lazyWithRetry = (importFn) =>
  lazy(async () => {
    const storageKey = 'arecgis:chunk-retry'
    const hasRefreshed = sessionStorage.getItem(storageKey) === '1'

    try {
      const module = await importFn()
      sessionStorage.setItem(storageKey, '0')
      return module
    } catch (error) {
      const message = String(error?.message || '')
      const isChunkLoadError =
        error?.name === 'ChunkLoadError' ||
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError')

      if (isChunkLoadError && !hasRefreshed) {
        sessionStorage.setItem(storageKey, '1')
        window.location.reload()
        return { default: () => null }
      }

      throw error
    }
  })

const SolarCalculator = lazyWithRetry(() => import('./features/solar-calculator/CalculatorPage'))

let theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#04acc4',
      light: '#63b4f6',
      dark: '#028a9e',
      contrastText: '#FFFFFF'
    },
    error: { main: '#e23046' },
    warning: { main: '#FFBF00' },
    info: { main: '#CBCBD4' },
    grey: { 100: '#dee7e6' }
  },
  typography: {
    allVariants: {
      fontFamily: 'Poppins',
      textTransform: 'none',
    },
    fontFamily: [
      'Poppins',
      '-apple-system',
      'BlinkMacSystemFont',
      "'Segoe UI'",
      'Roboto',
      "'Helvetica Neue'",
      'Arial',
      'sans-serif',
      "'Apple Color Emoji'",
      "'Segoe UI Emoji'",
      "'Segoe UI Symbol'",
    ].join(','),
  },
})

theme = responsiveFontSizes(theme)

function App() {
  useTitle('Solar Rooftop Calculator')
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<GlobalLoading message="Loading application…" />}>
          <CalculatorUIProvider>
            <Routes>
              <Route path='/' element={<Layout />}>
                <Route element={<PublicDashLayout />}>
                  <Route index element={<LandingPage />} />
                  <Route path='calculator' element={<SolarCalculator />} />
                </Route>
                <Route path='*' element={<NotFound />} />
              </Route>
            </Routes>
          </CalculatorUIProvider>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
