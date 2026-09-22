import { AppBar, Box, Toolbar, Typography } from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import { useCalculatorUI } from "../features/solar-calculator/context/CalculatorUIContext"

const PublicAppbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { drawerOpen } = useCalculatorUI() || {}

  const onCalculatorPage = location.pathname === '/calculator'

  // Hide the top bar while the calculator's floating input card is open, to avoid
  // duplicating the "Solar Rooftop Calculator" title shown in the card's own header.
  if (onCalculatorPage && drawerOpen) {
    return null
  }

  return (
    <>
      <Box
        sx={{
          height: 32,
          bgcolor: '#0d2135',
          color: '#ffffff',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.95rem' }}>
          Center for Affiliated Renewable Energy and Energy Efficiency and Conservation
        </Typography>
      </Box>
      <AppBar position="sticky" sx={{ bgcolor: '#ffffff', color: 'primary.main' }}>
        <Toolbar sx={{ flexWrap: 'wrap' }}>
          <Box
            component="img"
            sx={{ height: 50, width: 50, marginRight: 1, cursor: 'pointer' }}
            alt="Care logo"
            src="/care-logo.png"
            onClick={() => navigate('/')}
          />

          <Box sx={{ flexGrow: 1, ml: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Typography variant="h6" noWrap component="div">
              Solar Rooftop Calculator
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  )
}
export default PublicAppbar
