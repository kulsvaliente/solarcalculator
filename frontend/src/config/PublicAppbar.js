import { AppBar, Box, IconButton, Menu, MenuItem, Toolbar, Typography } from "@mui/material"
import SettingsIcon from '@mui/icons-material/Settings'
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useCalculatorUI } from "../features/solar-calculator/context/CalculatorUIContext"

const PublicAppbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { drawerOpen } = useCalculatorUI() || {}
  const [anchorElSettings, setAnchorElSettings] = useState(null)
  const openSettings = Boolean(anchorElSettings)
  const handleSettingsClick = (event) => setAnchorElSettings(event.currentTarget)
  const handleSettingsClose = () => setAnchorElSettings(null)

  // Solar calculator constants state
  const [solarConstants, setSolarConstants] = useState(() => {
    const saved = localStorage.getItem('solarConstants');
    return saved ? JSON.parse(saved) : { n: 0.23, ns: 0.8 };
  });

  const handleSolarConstantChange = (key, value) => {
    const newConstants = { ...solarConstants, [key]: parseFloat(value) };
    setSolarConstants(newConstants);
    localStorage.setItem('solarConstants', JSON.stringify(newConstants));
  };

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
          bgcolor: '#0d2135',
          color: '#ffffff',
          textAlign: 'center',
          py: 0.5,
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

        {onCalculatorPage && (
          <IconButton color="inherit" onClick={handleSettingsClick}>
            <SettingsIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Solar Calculator Settings Menu */}
      <Menu
        anchorEl={anchorElSettings}
        open={openSettings}
        onClose={handleSettingsClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disableRipple>
          n:&nbsp;
          <input
            type="number"
            step="0.01"
            value={solarConstants.n}
            onChange={(e) => handleSolarConstantChange("n", e.target.value)}
            style={{ marginLeft: 10, width: 60 }}
          />
        </MenuItem>
        <MenuItem disableRipple>
          ns:&nbsp;
          <input
            type="number"
            step="0.01"
            value={solarConstants.ns}
            onChange={(e) => handleSolarConstantChange("ns", e.target.value)}
            style={{ marginLeft: 10, width: 60 }}
          />
        </MenuItem>
      </Menu>
      </AppBar>
    </>
  )
}
export default PublicAppbar
