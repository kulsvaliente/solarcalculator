import React from 'react'
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material'

const GlobalLoading = ({ open = true, message = 'Loading…' }) => {
  return (
    <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={open}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress color="inherit" aria-label="Loading indicator" />
        {message ? (
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {message}
          </Typography>
        ) : null}
      </Box>
    </Backdrop>
  )
}

export default GlobalLoading


