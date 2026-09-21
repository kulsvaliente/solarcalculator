// src/components/About.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const About = ({ type = 'about', width = '100%', height = '100%' }) => {
  let content = '';

  if (type === 'about') {
    content = `
      <h3>About</h3>
      <p>
        <strong>Solar Rooftop Calculator</strong><br>
        The Solar Rooftop Calculator is a dynamic and user-friendly tool that helps homeowners, businesses, and institutions evaluate the potential of installing a solar photovoltaic (PV) system on their rooftops. It offers two calculation procedures that work together: <strong>Solar Rooftop Potential</strong> gives the capacity the rooftop can accommodate, while <strong>Monthly Consumption</strong> gives the actual system capacity needed to cover your electricity use. Running both lets you verify whether the rooftop potential is enough for the set-up your consumption actually requires. By integrating technical, financial, and geographic data, the calculator delivers customized recommendations to guide informed solar investment decisions.<br><br>
        💡 <strong>Key Features:</strong><br><br>
        <strong>1. Two Calculation Procedures That Verify Each Other</strong><br>
        - Each procedure answers a different question:<br>
        &nbsp;&nbsp;&bull; <strong>Solar Rooftop Potential</strong> &mdash; the capacity the rooftop can accommodate. It is a calculator of the potential capacity it could handle from the rooftop area.<br>
        &nbsp;&nbsp;&bull; <strong>Monthly Consumption</strong> &mdash; the actual system capacity needed. It is a calculator of the possible system capacity it needs based on your monthly consumption.<br>
        - Run one, then the other, to verify your set-up: if the rooftop potential meets or exceeds the capacity your consumption requires, the roof can carry the system you need. If it falls short, the roof can only cover part of your demand &mdash; and the gap tells you how much.<br>
        - Both procedures produce the same complete output: summary results, system comparison, what-if scenarios, and analysis.<br>
        - You can switch to the other procedure at any time, including directly from the results screen.<br><br>

        <strong>2. Smart PV System Sizing</strong><br>
        - In the Solar Rooftop Potential procedure, the capacity the roof can accommodate is computed from:<br>
        &nbsp;&nbsp;&bull; Roof area<br>
        &nbsp;&nbsp;&bull; Tilt angle<br>
        &nbsp;&nbsp;&bull; Orientation (azimuth)<br>
        &nbsp;&nbsp;&bull; Precise location, either by:<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&deg; Entering latitude and longitude, or<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&deg; Simply clicking on the roof location on an interactive map<br>
        - In the Monthly Consumption procedure, the capacity you actually need is computed from:<br>
        &nbsp;&nbsp;&bull; Your monthly electric bill and rate, or your monthly consumption in kWh, entered month by month<br>
        &nbsp;&nbsp;&bull; Month-by-month sun peak hours for your exact location<br>
        &nbsp;&nbsp;&bull; The highest monthly requirement of the year, so the system still covers your heaviest month<br>
        - Utilizes site-specific solar irradiance data to improve accuracy.<br><br>

        <strong>3. Cost & Payback Estimation</strong><br>
        - Provides an estimate of total installation cost based on system size and market rates.<br>
        - Calculates projected savings and payback period, giving users a clear picture of return on investment.<br><br>

        <strong>4. Interactive Parameter Adjustment</strong><br>
        - Allows users to modify variables in real-time, including:<br>
        &nbsp;&nbsp;&bull; Electricity rates<br>
        &nbsp;&nbsp;&bull; Roof area, tilt, and orientation<br>
        &nbsp;&nbsp;&bull; System type (e.g., off-grid or grid-tied)<br>
        - Instantly recalculates outputs based on changes, supporting flexible and comparative analysis.<br><br>

        <strong>5. Comprehensive System Options</strong><br>
        - Educates users on available solar configurations, including:<br>
        &nbsp;&nbsp;&bull; Off-Grid Systems: Fully independent solar solutions with battery storage.<br>
        &nbsp;&nbsp;&bull; Net-Metered Grid-Tied Systems: Connected to the utility grid, with net metering to offset electricity bills.<br>
        &nbsp;&nbsp;&bull; Net-Metered Hybrid Systems: Combines grid connection with battery backup for enhanced reliability and savings.<br><br>

        This calculator is ideal for feasibility studies, project pre-assessments, and promoting solar adoption through accessible, data-driven planning.
      </p>`;
  } else if (type === 'definition') {
    content = `
      <h3>Definition of Inputs and Calculations</h3>
      <ul style="text-align:left; padding-left: 20px;">
        <li><strong>Location:</strong> Enter or click a geographic location. This determines the sun exposure and solar radiation data used in calculations.</li>
        <li><strong>Roof Area (m²):</strong> The usable space on your rooftop for solar panel installation. Larger areas allow more panels, increasing potential output.</li>
        <li><strong>Latitude & Longitude:</strong> Coordinates of your chosen location. These are auto-filled when searching or clicking on the map.</li>
        <li><strong>Tilt (°):</strong> The angle of the solar panels from the horizontal plane. A tilt that matches your location's latitude is typically optimal.</li>
        <li><strong>Azimuth (°):</strong> The direction the solar panels face, measured in degrees from true north.. 180° is due south (ideal in the Philippines). Azimuth affects how much sunlight the panels receive throughout the day.</li>
        <li><strong>Solar Panel Size (kWp):</strong> The rated power output of a single solar panel, expressed in kilowatts peak. Common values range from 0.5 to 0.65 kWp.</li>
        <li><strong>Panel Efficiency:</strong> The efficiency of a solar panel in converting sunlight to electricity. For example, 0.18 = 18% of the sunlight is converted.</li>
        <li><strong>Daytime Use Percentage:</strong> is the proportion of your total daily electricity consumption that occurs during peak sunlight hours (typically 8:00 AM to 5:00 PM) when solar panels are actively generating electricity.</li>
        <li><strong>Electricity Rate (₱/kWh):</strong> Your current electricity rate per kilowatt-hour. This is used to calculate potential savings.</li>
        <li><strong>Monthly Electric Bill (₱):</strong> Used in the Monthly Consumption procedure. Your bill amount for a given month &mdash; paired with that month's rate, the calculator converts it into consumption automatically.</li>
        <li><strong>Monthly Consumption (kWh):</strong> Used in the Monthly Consumption procedure. The energy your household or facility uses in a month. Enter it directly, or let the calculator derive it from your bill and rate.</li>
        <li><strong>Sun Peak Hours:</strong> The equivalent number of hours per day of full-strength sunlight at your location, taken month by month from solar irradiance data. This is what turns your consumption into a required system capacity.</li>
      </ul>
      <h4>Key Calculations Explained:</h4>
      <ul style="text-align:left; padding-left: 20px;">
        <li><strong>Rooftop Potential Capacity:</strong> The capacity the rooftop can accommodate. Based on roof area, panel size, and panel efficiency, it gives the largest system size in kilowatts peak (kWp) that will physically fit.</li>
        <li><strong>Required Capacity:</strong> The actual system capacity you need, from the Monthly Consumption procedure. For each month it is consumption ÷ overall efficiency ÷ sun peak hours ÷ days in the month; the highest month is taken, so the system still covers your heaviest demand.</li>
        <li><strong>Verification:</strong> Compare the two &mdash; if the rooftop potential capacity is equal to or greater than the required capacity, the roof can carry the system your consumption calls for. If it is lower, the roof can only offset part of your bill.</li>
        <li><strong>Estimated Daily Production:</strong> Average energy generated daily, accounting for system and panel efficiency and local sun hours.</li>
        <li><strong>Annual Energy Production:</strong> Sum of monthly energy production (sun peak hours × system capacity × days in month × 0.8).</li>
        <li><strong>System Cost:</strong> Estimated price range for Off-grid, Grid-tied, and Hybrid systems based on the system size.</li>
        <li><strong>Payback Period:</strong> The number of years needed to recover your investment, calculated by dividing system cost by estimated yearly savings.</li>
      </ul>`;
  } else if (type === 'howto') {
    content = `
      <h3>How to Use the Solar Rooftop Calculator</h3>
      <p>
      <strong>1. Choose a calculation procedure</strong><br>
      A selector appears first. Pick the procedure that matches what you want to find out:<br>
      <ul style="text-align:left; padding-left: 40px;">
        <li>Solar Rooftop Potential – how much capacity your rooftop area can accommodate.</li>
        <li>Monthly Consumption – how much capacity you actually need, based on your electricity use.</li>
        <li>Run one, then use the switch button to run the other, to check whether your roof can carry the system you need.</li>
      </ul><br>
      <strong>2. Set your location</strong><br>
      Enter your desired location in the search bar or click the Find Current Location button to automatically retrieve your latitude and longitude. You may also click directly on the map to select your site.<br>
      <strong>3. Input System Details — Solar Rooftop Potential</strong><br>
      The input card shows only the fields your chosen procedure needs. For Solar Rooftop Potential, provide the specifications of your rooftop solar system, including:<br>
      <ul style="text-align:left; padding-left: 40px;">
        <li>Roof Area – The total usable surface area (in square meters) available for solar panel installation. You can measure the area by clicking the Measure button next to the Roof Area Input. The shape can be edited with the buttons on the left</li>
        <li>Tilt – The angle at which your solar panels are inclined relative to the ground. A flat panel has 0° tilt, while a steeper tilt (e.g., 15°–30°) may improve sunlight capture.</li>
        <li>Orientation (Azimuth) – The compass direction the panels face, measured in degrees from true north (0° = North, 90° = East, 180° = South, 270° = West). In the Philippines, a 180° (South) orientation is generally optimal.</li>
      </ul><br>
      <strong>4. Input System Details — Monthly Consumption</strong><br>
      For Monthly Consumption, the roof-design fields are replaced by a twelve-month usage table:<br>
      <ul style="text-align:left; padding-left: 40px;">
        <li>Electric Bill and Rate – fill both for a month and the consumption for that month is computed for you.</li>
        <li>Consumption (kWh) – or type the kWh directly if you already know it.</li>
        <li>Sun Hours – filled in automatically for your location, month by month, once a location is set.</li>
        <li>Panel Size – still required, so the calculator can turn the required capacity into a panel count.</li>
        <li>One month is enough to get a result, but filling all twelve gives the most accurate sizing.</li>
      </ul><br>
      <strong>5. How Monthly Consumption is Sized</strong><br>
      As you fill in the table, live "Solar Capacity" and "Panels" preview cards update above it. Behind them, for every month with data the calculator works out:<br>
      <ul style="text-align:left; padding-left: 40px;">
        <li>Required capacity for that month = consumption ÷ overall efficiency ÷ that month's sun peak hours ÷ days in the month.</li>
        <li>The system is then sized to your single highest-demand month, so it still fully covers your peak usage, not just your average.</li>
        <li>That capacity is what feeds into Calculate — the same Summary &amp; Results, System Comparison, What-If Scenarios, and Analysis tabs you'd get from Solar Rooftop Potential.</li>
      </ul><br>
      <strong>6. View Results</strong><br>
      Click Calculate to generate estimated outputs, including the recommended system capacity, expected energy production, and projected savings.<br>
      <ul style="text-align:left; padding-left: 40px;">
        <li>From Solar Rooftop Potential, the headline capacity is what your roof area can accommodate.</li>
        <li>From Monthly Consumption, the headline capacity is what your usage actually requires.</li>
        <li>Use the "Switch procedure" button on the results screen to run the other one and compare — if the rooftop potential meets or exceeds the required capacity, your roof can carry the system you need.</li>
      </ul><br>
      <strong>7. What If Scenarios</strong><br>
      This feature provides a flexible and interactive environment in which the user can modify key assumptions through a slider. Click Apply configuration to apply changes.<br>
      <ul style="text-align:left; padding-left: 40px;">
        </ul><br>
      <strong>8. New Calculations</strong><br>
      For new calculations, either change the location or change some parameters or click New Calculations Button<br>
      </p>
      `;
  }

  return (
    <Box
      sx={{
        width,
        height,
        overflow: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <Typography
        component="div"
        dangerouslySetInnerHTML={{ __html: content }}
        sx={{ width: '100%', maxWidth: '1400px', p: 2 }}
      />
    </Box>
  );
};

export default About;

