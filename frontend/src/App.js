import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'
import { CssBaseline, Box, Typography } from '@mui/material'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import PublicDashLayout from './components/PublicDashLayout'
import LandingPage from './components/LandingPage'
import useTitle from './hooks/useTitle';
import GlobalLoading from './components/GlobalLoading'
import NotFound from './components/NotFound'
import { CalculatorUIProvider } from './features/solar-calculator/context/CalculatorUIContext'

// Slides each route's page (including its own background) horizontally in/out, so
// navigating between the landing page and the calculator reads as one page pushing
// the other out, rather than a plain fade.
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 80 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -80 }}
    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
)

const CALC_INTRO_DURATION_MS = 2000

// A little calculator whose keys light up one after another, like someone actively
// punching in numbers — over a white splash screen, right as the calculator page opens.
const CALC_KEY_COLORS = [
  '#3a3a3a', '#3a3a3a', '#3a3a3a', '#f57c00',
  '#3a3a3a', '#3a3a3a', '#3a3a3a', '#f57c00',
  '#3a3a3a', '#3a3a3a', '#3a3a3a', '#f57c00',
  '#7e57c2', '#3a3a3a', '#3a3a3a', '#1976d2'
]

const CalculatorIntro = () => (
  <Box
    component={motion.div}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25 }}
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      bgcolor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}
  >
    <Box
      sx={{
        width: 128,
        p: 1.25,
        borderRadius: 3,
        bgcolor: '#232323',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
      }}
    >
      <Box
        sx={{
          height: 26,
          borderRadius: 1,
          bgcolor: '#0d0d0d',
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 1
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: '#1976d2', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}
        >
          0.7
        </motion.span>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.6 }}>
        {CALC_KEY_COLORS.map((color, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.35, scale: 1 }}
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 0.85, 1] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i * 1.4) / CALC_KEY_COLORS.length
            }}
            style={{ aspectRatio: '1', borderRadius: 4, background: color }}
          />
        ))}
      </Box>
    </Box>
    <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 700, mt: 2.5, letterSpacing: 0.3 }}>
      Solar Rooftop Calculator
    </Typography>
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 160, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{ height: 1, background: 'rgba(0,0,0,0.15)', marginTop: 12 }}
    />
  </Box>
)

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
  const location = useLocation()
  const previousPathname = useRef(location.pathname)
  const [showCalcIntro, setShowCalcIntro] = useState(false)

  useEffect(() => {
    const enteringCalculator =
      location.pathname === '/calculator' && previousPathname.current !== '/calculator'
    if (enteringCalculator) {
      setShowCalcIntro(true)
      const timer = setTimeout(() => setShowCalcIntro(false), CALC_INTRO_DURATION_MS)
      previousPathname.current = location.pathname
      return () => clearTimeout(timer)
    }
    previousPathname.current = location.pathname
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<GlobalLoading message="Loading application…" />}>
          <CalculatorUIProvider>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path='/' element={<Layout />}>
                  <Route element={<PublicDashLayout />}>
                    <Route index element={<PageTransition><LandingPage /></PageTransition>} />
                    <Route path='calculator' element={<PageTransition><SolarCalculator /></PageTransition>} />
                  </Route>
                  <Route path='*' element={<NotFound />} />
                </Route>
              </Routes>
            </AnimatePresence>
            <AnimatePresence>
              {showCalcIntro && <CalculatorIntro />}
            </AnimatePresence>
          </CalculatorUIProvider>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
