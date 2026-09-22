import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCalculatorUI } from '../features/solar-calculator/context/CalculatorUIContext';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined';

// ---- About content ----
const ABOUT_INTRO =
  'The Solar Rooftop Calculator is a dynamic and user-friendly tool that helps homeowners, ' +
  'businesses, and institutions evaluate the potential of installing a solar photovoltaic (PV) ' +
  'system on their rooftops. It offers two calculation procedures that work together: Solar ' +
  'Rooftop Potential gives the capacity the rooftop can accommodate, while Monthly Consumption ' +
  'gives the actual system capacity needed to cover your electricity use. Running both lets you ' +
  'verify whether the rooftop potential is enough for the set-up your consumption actually ' +
  'requires. By integrating technical, financial, and geographic data, the calculator delivers ' +
  'customized recommendations to guide informed solar investment decisions.';

const ABOUT_CLOSING =
  'This calculator is ideal for quick estimates, project pre-assessments, and promoting ' +
  'solar adoption through accessible, data-driven planning.';

const ABOUT_FEATURES = [
  {
    title: 'Two Calculation Procedures That Verify Each Other',
    points: [
      {
        text: 'Each procedure answers a different question:',
        sub: [
          'Solar Rooftop Potential — the capacity the rooftop can accommodate. It is a calculator of the potential capacity it could handle from the rooftop area.',
          'Monthly Consumption — the actual system capacity needed. It is a calculator of the possible system capacity it needs based on your monthly consumption.',
        ],
      },
      { text: 'Run one, then the other, to verify your set-up: if the rooftop potential meets or exceeds the capacity your consumption requires, the roof can carry the system you need. If it falls short, the roof can only cover part of your demand — and the gap tells you how much.' },
      { text: 'Both procedures produce the same complete output: summary results, system comparison, what-if scenarios, and analysis.' },
      { text: 'You can switch to the other procedure at any time, including directly from the results screen.' },
    ],
  },
  {
    title: 'Smart PV System Sizing',
    points: [
      {
        text: 'In the Solar Rooftop Potential procedure, the capacity the roof can accommodate is computed from:',
        sub: [
          'Roof area',
          'Tilt angle',
          'Orientation (azimuth)',
          'Precise location, either by entering latitude and longitude, or simply clicking on the roof location on an interactive map',
        ],
      },
      {
        text: 'In the Monthly Consumption procedure, the capacity you actually need is computed from:',
        sub: [
          'Your monthly electric bill and rate, or your monthly consumption in kWh, entered month by month',
          'Month-by-month sun peak hours for your exact location',
          'The highest monthly requirement of the year, so the system still covers your heaviest month',
        ],
      },
      { text: 'Utilizes site-specific solar irradiance data to improve accuracy.' },
    ],
  },
  {
    title: 'Cost & Payback Estimation',
    points: [
      { text: 'Provides an estimate of total installation cost based on system size and market rates.' },
      { text: 'Calculates projected savings and payback period, giving users a clear picture of return on investment.' },
    ],
  },
  {
    title: 'Interactive Parameter Adjustment',
    points: [
      {
        text: 'Allows users to modify variables in real-time, including:',
        sub: ['Electricity rates', 'Roof area, tilt, and orientation', 'System type (e.g., off-grid or grid-tied)'],
      },
      { text: 'Instantly recalculates outputs based on changes, supporting flexible and comparative analysis.' },
    ],
  },
  {
    title: 'Comprehensive System Options',
    points: [
      {
        text: 'Educates users on available solar configurations, including:',
        sub: [
          'Off-Grid Systems: Fully independent solar solutions with battery storage.',
          'Net-Metered Grid-Tied Systems: Connected to the utility grid, with net metering to offset electricity bills.',
          'Net-Metered Hybrid Systems: Combines grid connection with battery backup for enhanced reliability and savings.',
        ],
      },
    ],
  },
];

// ---- Definition content ----
const INPUT_DEFINITIONS = [
  { term: 'Location', desc: 'Enter or click a geographic location. This determines the sun exposure and solar radiation data used in calculations.' },
  { term: 'Roof Area (m²)', desc: 'The usable space on your rooftop for solar panel installation. Larger areas allow more panels, increasing potential output.' },
  { term: 'Latitude & Longitude', desc: 'Coordinates of your chosen location. These are auto-filled when searching or clicking on the map.' },
  { term: 'Tilt (°)', desc: "The angle of the solar panels from the horizontal plane. A tilt that matches your location's latitude is typically optimal." },
  { term: 'Azimuth (°)', desc: 'The direction the solar panels face, measured in degrees from true north. 180° is due south (ideal in the Philippines). Azimuth affects how much sunlight the panels receive throughout the day.' },
  { term: 'Solar Panel Size (kWp)', desc: 'The rated power output of a single solar panel, expressed in kilowatts peak. Common values range from 0.5 to 0.65 kWp.' },
  { term: 'Panel Efficiency', desc: 'The efficiency of a solar panel in converting sunlight to electricity. For example, 0.18 = 18% of the sunlight is converted.' },
  { term: 'Daytime Use Percentage', desc: 'The proportion of your total daily electricity consumption that occurs during peak sunlight hours (typically 8:00 AM to 5:00 PM) when solar panels are actively generating electricity.' },
  { term: 'Electricity Rate (₱/kWh)', desc: 'Your current electricity rate per kilowatt-hour. This is used to calculate potential savings.' },
  { term: 'Monthly Electric Bill (₱)', desc: 'Used in the Monthly Consumption procedure. Your bill amount for a given month — paired with that month’s rate, the calculator converts it into consumption automatically.' },
  { term: 'Monthly Consumption (kWh)', desc: 'Used in the Monthly Consumption procedure. The energy your household or facility uses in a month. Enter it directly, or let the calculator derive it from your bill and rate.' },
  { term: 'Sun Peak Hours', desc: 'The equivalent number of hours per day of full-strength sunlight at your location, taken month by month from solar irradiance data. This is what turns your consumption into a required system capacity.' },
];

const CALCULATION_DEFINITIONS = [
  { term: 'Rooftop Potential Capacity', desc: 'The capacity the rooftop can accommodate. Based on roof area, panel size, and panel efficiency, it gives the largest system size in kilowatts peak (kWp) that will physically fit.' },
  { term: 'Required Capacity', desc: 'The actual system capacity you need, from the Monthly Consumption procedure. For each month it is consumption ÷ overall efficiency ÷ sun peak hours ÷ days in the month; the highest month is taken, so the system still covers your heaviest demand.' },
  { term: 'Verification', desc: 'Compare the two: if the rooftop potential capacity is equal to or greater than the required capacity, the roof can carry the system your consumption calls for. If it is lower, the roof can only offset part of your bill.' },
  { term: 'Estimated Daily Production', desc: 'Average energy generated daily, accounting for system and panel efficiency and local sun hours.' },
  { term: 'Annual Energy Production', desc: 'Sum of monthly energy production (sun peak hours × system capacity × days in month × 0.8).' },
  { term: 'System Cost', desc: 'Estimated price range for Off-grid, Grid-tied, and Hybrid systems based on the system size.' },
  { term: 'Payback Period', desc: 'The number of years needed to recover your investment, calculated by dividing system cost by estimated yearly savings.' },
];

// ---- How to use content ----
const HOW_TO_USE_STEPS = [
  {
    icon: <AltRouteOutlinedIcon color="primary" />,
    title: 'Choose a calculation procedure',
    desc: 'A selector appears first. Pick the procedure that matches what you want to find out:',
    sub: [
      'Solar Rooftop Potential – how much capacity your rooftop area can accommodate.',
      'Monthly Consumption – how much capacity you actually need, based on your electricity use.',
      'Run one, then use the switch button to run the other, to check whether your roof can carry the system you need.',
    ],
  },
  {
    icon: <LocationOnOutlinedIcon color="primary" />,
    title: 'Set your location',
    desc: 'Enter your desired location in the search bar or click the "Find Current Location" button to automatically retrieve your latitude and longitude. You may also click directly on the map to select your site.',
  },
  {
    icon: <TuneOutlinedIcon color="primary" />,
    title: 'Input system details — Solar Rooftop Potential',
    desc: 'The input card shows only the fields your chosen procedure needs. For Solar Rooftop Potential, provide the specifications of your rooftop solar system:',
    sub: [
      'Roof Area – the total usable surface area (in square meters) available for solar panel installation. Measure it with the "Measure" button next to the Roof Area input; the shape can be edited with the buttons on the left.',
      'Tilt – the angle at which your solar panels are inclined relative to the ground. A flat panel has 0° tilt, while a steeper tilt (e.g., 15°–30°) may improve sunlight capture.',
      'Orientation (Azimuth) – the compass direction the panels face, measured in degrees from true north (0° = North, 90° = East, 180° = South, 270° = West). In the Philippines, a 180° (South) orientation is generally optimal.',
    ],
  },
  {
    icon: <TuneOutlinedIcon color="primary" />,
    title: 'Input system details — Monthly Consumption',
    desc: 'For Monthly Consumption, the roof-design fields are replaced by a twelve-month usage table:',
    sub: [
      'Electric Bill and Rate – fill both for a month and the consumption for that month is computed for you.',
      'Consumption (kWh) – or type the kWh directly if you already know it.',
      'Sun Hours – filled in automatically for your location, month by month, once a location is set.',
      'Panel Size – still required, so the calculator can turn the required capacity into a panel count.',
      'One month is enough to get a result, but filling all twelve gives the most accurate sizing.',
    ],
  },
  {
    icon: <InsightsOutlinedIcon color="primary" />,
    title: 'How Monthly Consumption is sized',
    desc: 'As you fill in the table, live "Solar Capacity" and "Panels" preview cards update above it. Behind them, for every month with data the calculator works out:',
    sub: [
      'Required capacity for that month = consumption ÷ overall efficiency ÷ that month\'s sun peak hours ÷ days in the month.',
      'The system is then sized to your single highest-demand month, so it still fully covers your peak usage, not just your average.',
      'That capacity is what feeds into Calculate — the same Summary & Results, System Comparison, What-If Scenarios, and Analysis tabs you\'d get from Solar Rooftop Potential.',
    ],
  },
  {
    icon: <InsightsOutlinedIcon color="primary" />,
    title: 'View results',
    desc: 'Click "Calculate" to generate estimated outputs, including the recommended system capacity, expected energy production, and projected savings.',
    sub: [
      'From Solar Rooftop Potential, the headline capacity is what your roof area can accommodate.',
      'From Monthly Consumption, the headline capacity is what your usage actually requires.',
      'Use the "Switch procedure" button on the results screen to run the other one and compare — if the rooftop potential meets or exceeds the required capacity, your roof can carry the system you need.',
    ],
  },
  {
    icon: <TuneOutlinedIcon color="primary" />,
    title: 'What If Scenarios',
    desc: 'This feature provides a flexible and interactive environment in which the user can modify key assumptions through a slider. Click "Apply Configuration" to apply changes.',
  },
  {
    icon: <RestartAltIcon color="primary" />,
    title: 'New calculations',
    desc: 'For new calculations, either change the location, change some parameters, or click the "New Calculation" button.',
  },
];

const InfoDialog = ({ open, onClose, title, children }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {title}
      <IconButton onClick={onClose} size="small" aria-label="Close">
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">Got it</Button>
    </DialogActions>
  </Dialog>
);

// Renders a bullet list where each item may have an indented `sub` list beneath it
const BulletList = ({ items, dense }) => (
  <Box component="ul" sx={{ m: 0, pl: 2.5, mb: dense ? 0.5 : 1 }}>
    {items.map((item, i) => {
      const isPlainString = typeof item === 'string';
      const text = isPlainString ? item : item.text;
      const sub = isPlainString ? null : item.sub;
      return (
        <Box component="li" key={i} sx={{ mb: 0.5 }}>
          <Typography variant="body2" component="span">{text}</Typography>
          {Array.isArray(sub) && (
            <Box component="ul" sx={{ mt: 0.5, mb: 0.5, pl: 2.5, listStyleType: 'circle' }}>
              {sub.map((subText, j) => (
                <Box component="li" key={j}>
                  <Typography variant="body2" color="text.secondary">{subText}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      );
    })}
  </Box>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { setDrawerOpen } = useCalculatorUI() || {};
  const [openDialog, setOpenDialog] = useState(null); // 'about' | 'definition' | 'howto' | null

  const close = () => setOpenDialog(null);

  const handleStartCalculating = () => {
    setDrawerOpen?.(true); // Input card always floats open by default when entering the calculator
    navigate('/calculator');
  };

  return (
    <Box
      sx={{
        // Fills exactly what's left below the institutional strip (32px) + app bar (64px),
        // with no page-level scroll — the whole landing page fits in one screen.
        height: 'calc(100vh - 96px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        // No background of its own — the shared body background (same image, set in
        // index.css) shows through instead. Keeping it there (outside the page-transition's
        // transformed element) is what keeps it truly fixed instead of sliding with the page.
        py: { xs: 1.5, md: 2 },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.55)',
            borderRadius: 3,
            boxShadow: 3,
            overflow: 'hidden',
          }}
        >
          {/* Gradient header strip */}
          <Box
            sx={{
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
              px: { xs: 3, sm: 5 },
              py: { xs: 1, sm: 1.25 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SolarPowerIcon sx={{ fontSize: { xs: 36, sm: 40 }, color: 'warning.main' }} />
          </Box>

          {/* Welcome message */}
          <Box sx={{ px: { xs: 3, sm: 5, md: 6 }, pt: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary.main"
              sx={{ fontSize: { xs: '1.4rem', sm: '1.7rem' } }}
            >
              Welcome to the Solar Rooftop Calculator
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Let's find out how much solar power your rooftop can generate.
            </Typography>
          </Box>

          {/* Two-column body: supporting copy on the left, heading + CTA on the right */}
          <Box sx={{ px: { xs: 3, sm: 5, md: 6 }, py: { xs: 2, sm: 2.5 } }}>
            <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="body2" color="text.secondary">
                    The Solar Rooftop Calculator is a dynamic and user-friendly tool that helps
                    homeowners, businesses, and institutions evaluate the potential of installing a
                    solar photovoltaic (PV) system on their rooftops.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Calculate from your <strong>rooftop area</strong> to see the capacity your roof
                    can accommodate, or from your <strong>monthly consumption</strong> to see the
                    system capacity you actually need — then compare the two to verify that your
                    rooftop can carry the set-up your usage calls for.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack
                  spacing={1.5}
                  alignItems={{ xs: 'center', sm: 'flex-start' }}
                  textAlign={{ xs: 'center', sm: 'left' }}
                  sx={{
                    borderLeft: { xs: 'none', sm: '1px solid' },
                    borderColor: 'divider',
                    pl: { xs: 0, sm: 4 },
                  }}
                >
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' }, lineHeight: 1.15 }}
                  >
                    Start Calculating
                  </Typography>
                  <Button
                    size="large"
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleStartCalculating}
                    sx={{ px: 4, py: 1, borderRadius: 2 }}
                  >
                    Proceed
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ my: { xs: 2, sm: 2.5 } }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ width: '100%' }}
            >
            <Button
              variant="outlined"
              startIcon={<InfoOutlinedIcon />}
              onClick={() => setOpenDialog('about')}
              sx={{ flex: 1 }}
            >
              About
            </Button>
            <Button
              variant="outlined"
              startIcon={<MenuBookOutlinedIcon />}
              onClick={() => setOpenDialog('definition')}
              sx={{ flex: 1 }}
            >
              Definition
            </Button>
            <Button
              variant="outlined"
              startIcon={<HelpOutlineIcon />}
              onClick={() => setOpenDialog('howto')}
              sx={{ flex: 1 }}
            >
              How to Use
            </Button>
          </Stack>
          </Box>
        </Box>
      </Container>

      {/* About */}
      <InfoDialog open={openDialog === 'about'} onClose={close} title="About this tool">
        <Typography paragraph>{ABOUT_INTRO}</Typography>

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          💡 Key Features
        </Typography>

        {ABOUT_FEATURES.map((feature, idx) => (
          <Box key={feature.title} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
              {idx + 1}. {feature.title}
            </Typography>
            <BulletList items={feature.points} />
          </Box>
        ))}

        <Typography sx={{ mt: 1 }}>{ABOUT_CLOSING}</Typography>
      </InfoDialog>

      {/* Definition */}
      <InfoDialog open={openDialog === 'definition'} onClose={close} title="Definition of Inputs and Calculations">
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1 }}
        >
          Inputs
        </Typography>
        <List disablePadding sx={{ '& > li + li': { borderTop: '1px solid', borderColor: 'divider' } }}>
          {INPUT_DEFINITIONS.map((item) => (
            <ListItem key={item.term} disableGutters sx={{ alignItems: 'flex-start', py: 1.5 }}>
              <ListItemText
                primary={item.term}
                secondary={item.desc}
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}
                secondaryTypographyProps={{ sx: { mt: 0.4, lineHeight: 1.65 } }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="overline"
          sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1 }}
        >
          Key Calculations Explained
        </Typography>
        <List disablePadding sx={{ '& > li + li': { borderTop: '1px solid', borderColor: 'divider' } }}>
          {CALCULATION_DEFINITIONS.map((item) => (
            <ListItem key={item.term} disableGutters sx={{ alignItems: 'flex-start', py: 1.5 }}>
              <ListItemText
                primary={item.term}
                secondary={item.desc}
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}
                secondaryTypographyProps={{ sx: { mt: 0.4, lineHeight: 1.65 } }}
              />
            </ListItem>
          ))}
        </List>
      </InfoDialog>

      {/* How to use */}
      <InfoDialog open={openDialog === 'howto'} onClose={close} title="How to Use the Solar Rooftop Calculator">
        <List disablePadding>
          {HOW_TO_USE_STEPS.map((step, idx) => (
            <ListItem key={step.title} disableGutters alignItems="flex-start" sx={{ py: 1.25 }}>
              <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>{step.icon}</ListItemIcon>
              <ListItemText
                primary={`${idx + 1}. ${step.title}`}
                primaryTypographyProps={{ fontWeight: 700 }}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" component="span">
                      {step.desc}
                    </Typography>
                    {step.sub && <BulletList items={step.sub} dense />}
                  </>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItem>
          ))}
        </List>
      </InfoDialog>
    </Box>
  );
};

export default LandingPage;
