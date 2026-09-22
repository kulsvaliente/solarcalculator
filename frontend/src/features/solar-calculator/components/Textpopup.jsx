// src/components/About.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

// Shared inline-HTML building blocks so About / Definition / How-to-Use all read with the
// same spacing and typographic hierarchy (dangerouslySetInnerHTML can't reach page CSS, so
// every style has to be inline here).
const sectionLabel = (label) =>
  `<h4 style="margin:0 0 10px; color:#1976d2; text-transform:uppercase; font-size:0.85rem; letter-spacing:1px; font-weight:700;">${label}</h4>`;

const defTerm = (term, desc) => `
        <li style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #e0e0e0; line-height:1.65;">
          <strong style="display:block; margin-bottom:4px; font-size:0.98rem; color:#212121;">${term}</strong>
          <span style="color:#555;">${desc}</span>
        </li>`;

const bulletList = (items) =>
  `<ul style="margin:8px 0 0; padding-left:20px; color:#555; line-height:1.7;">${items
    .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
    .join('')}</ul>`;

const featureBlock = (title, points) => `
        <li style="list-style:none; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #e0e0e0;">
          <div style="font-weight:700; font-size:0.98rem; color:#212121;">${title}</div>
          ${points ? bulletList(points) : ''}
        </li>`;

const stepBlock = (num, title, desc, subItems) => `
        <li style="list-style:none; display:flex; gap:14px; margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid #e0e0e0;">
          <span style="flex-shrink:0; width:28px; height:28px; border-radius:50%; background:#1976d2; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem;">${num}</span>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.98rem; color:#212121; margin-bottom:${desc || subItems ? '6px' : '0'};">${title}</div>
            ${desc ? `<div style="color:#555; line-height:1.65; margin-bottom:${subItems ? '8px' : '0'};">${desc}</div>` : ''}
            ${subItems && subItems.length ? bulletList(subItems) : ''}
          </div>
        </li>`;

const About = ({ type = 'about', width = '100%', height = '100%' }) => {
  let content = '';

  if (type === 'about') {
    content = `
      <h3 style="margin:0 0 16px; color:#1976d2; font-size:1.3rem;">About</h3>
      <p style="margin:0 0 20px; line-height:1.7; color:#333;">
        <strong>Solar Rooftop Calculator</strong> is a dynamic and user-friendly tool that helps
        homeowners, businesses, and institutions evaluate the potential of installing a solar
        photovoltaic (PV) system on their rooftops. It offers two calculation procedures that
        work together: <strong>Solar Rooftop Potential</strong> gives the capacity the rooftop
        can accommodate, while <strong>Monthly Consumption</strong> gives the actual system
        capacity needed to cover your electricity use. Running both lets you verify whether the
        rooftop potential is enough for the set-up your consumption actually requires. By
        integrating technical, financial, and geographic data, the calculator delivers
        customized recommendations to guide informed solar investment decisions.
      </p>
      ${sectionLabel('💡 Key Features')}
      <ul style="margin:0 0 20px; padding:0;">
        ${featureBlock('1. Two Calculation Procedures That Verify Each Other', [
          '<strong>Solar Rooftop Potential</strong> &mdash; the capacity the rooftop can accommodate, from the rooftop area.',
          '<strong>Monthly Consumption</strong> &mdash; the actual system capacity needed, from your monthly consumption.',
          'Run one, then the other, to verify your set-up: if the rooftop potential meets or exceeds the required capacity, the roof can carry the system you need. If it falls short, the gap tells you how much.',
          'Both procedures produce the same complete output: summary results, system comparison, what-if scenarios, and analysis &mdash; switch between them at any time, including from the results screen.'
        ])}
        ${featureBlock('2. Smart PV System Sizing', [
          'Solar Rooftop Potential is computed from: roof area, tilt angle, orientation (azimuth), and precise location (entered coordinates or a map click).',
          'Monthly Consumption is computed from: your monthly electric bill/rate or kWh usage, month-by-month sun peak hours for your location, and the highest monthly requirement of the year.',
          'Utilizes site-specific solar irradiance data to improve accuracy.'
        ])}
        ${featureBlock('3. Cost &amp; Payback Estimation', [
          'Estimates total installation cost based on system size and market rates.',
          'Calculates projected savings and payback period, giving a clear picture of return on investment.'
        ])}
        ${featureBlock('4. Interactive Parameter Adjustment', [
          'Modify variables in real-time: electricity rates, roof area/tilt/orientation, and system type (e.g., off-grid or grid-tied).',
          'Instantly recalculates outputs based on changes, supporting flexible and comparative analysis.'
        ])}
        ${featureBlock('5. Comprehensive System Options', [
          '<strong>Off-Grid Systems:</strong> fully independent solar solutions with battery storage.',
          '<strong>Net-Metered Grid-Tied Systems:</strong> connected to the utility grid, with net metering to offset electricity bills.',
          '<strong>Net-Metered Hybrid Systems:</strong> combines grid connection with battery backup for enhanced reliability and savings.'
        ])}
      </ul>
      <p style="margin:0; line-height:1.7; color:#333;">
        This calculator is ideal for feasibility studies, project pre-assessments, and promoting
        solar adoption through accessible, data-driven planning.
      </p>`;
  } else if (type === 'definition') {
    content = `
      <h3 style="margin:0 0 20px; color:#1976d2; font-size:1.3rem;">Definition of Inputs and Calculations</h3>
      ${sectionLabel('Inputs')}
      <ul style="text-align:left; padding-left:0; margin:0 0 28px; list-style:none;">
        ${defTerm('Location', 'Enter or click a geographic location. This determines the sun exposure and solar radiation data used in calculations.')}
        ${defTerm('Roof Area (m²)', 'The usable space on your rooftop for solar panel installation. Larger areas allow more panels, increasing potential output.')}
        ${defTerm('Latitude &amp; Longitude', 'Coordinates of your chosen location. These are auto-filled when searching or clicking on the map.')}
        ${defTerm('Tilt (°)', "The angle of the solar panels from the horizontal plane. A tilt that matches your location's latitude is typically optimal.")}
        ${defTerm('Azimuth (°)', '180° is due south (ideal in the Philippines). Azimuth affects how much sunlight the panels receive throughout the day.')}
        ${defTerm('Solar Panel Size (kWp)', 'The rated power output of a single solar panel, expressed in kilowatts peak. Common values range from 0.5 to 0.65 kWp.')}
        ${defTerm('Panel Efficiency', 'The efficiency of a solar panel in converting sunlight to electricity. For example, 0.18 = 18% of the sunlight is converted.')}
        ${defTerm('Daytime Use Percentage', 'The proportion of your total daily electricity consumption that occurs during peak sunlight hours (typically 8:00 AM to 5:00 PM) when solar panels are actively generating electricity.')}
        ${defTerm('Electricity Rate (₱/kWh)', 'Your current electricity rate per kilowatt-hour. This is used to calculate potential savings.')}
        ${defTerm('Monthly Electric Bill (₱)', "Used in the Monthly Consumption procedure. Your bill amount for a given month &mdash; paired with that month's rate, the calculator converts it into consumption automatically.")}
        ${defTerm('Monthly Consumption (kWh)', 'Used in the Monthly Consumption procedure. The energy your household or facility uses in a month. Enter it directly, or let the calculator derive it from your bill and rate.')}
        ${defTerm('Sun Peak Hours', 'The equivalent number of hours per day of full-strength sunlight at your location, taken month by month from solar irradiance data. This is what turns your consumption into a required system capacity.')}
      </ul>
      ${sectionLabel('Key Calculations Explained')}
      <ul style="text-align:left; padding-left:0; margin:0; list-style:none;">
        ${defTerm('Rooftop Potential Capacity', 'The capacity the rooftop can accommodate. Based on roof area, panel size, and panel efficiency, it gives the largest system size in kilowatts peak (kWp) that will physically fit.')}
        ${defTerm('Required Capacity', 'The actual system capacity you need, from the Monthly Consumption procedure. For each month it is consumption ÷ overall efficiency ÷ sun peak hours ÷ days in the month; the highest month is taken, so the system still covers your heaviest demand.')}
        ${defTerm('Verification', 'Compare the two &mdash; if the rooftop potential capacity is equal to or greater than the required capacity, the roof can carry the system your consumption calls for. If it is lower, the roof can only offset part of your bill.')}
        ${defTerm('Estimated Daily Production', 'Average energy generated daily, accounting for system and panel efficiency and local sun hours.')}
        ${defTerm('Annual Energy Production', 'Sum of monthly energy production (sun peak hours × system capacity × days in month × 0.8).')}
        ${defTerm('System Cost', 'Estimated price range for Off-grid, Grid-tied, and Hybrid systems based on the system size.')}
        ${defTerm('Payback Period', 'The number of years needed to recover your investment, calculated by dividing system cost by estimated yearly savings.')}
      </ul>`;
  } else if (type === 'howto') {
    content = `
      <h3 style="margin:0 0 20px; color:#1976d2; font-size:1.3rem;">How to Use the Solar Rooftop Calculator</h3>
      <ul style="margin:0; padding:0;">
        ${stepBlock(
          1,
          'Choose a calculation procedure',
          'A selector appears first. Pick the procedure that matches what you want to find out:',
          [
            'Solar Rooftop Potential &ndash; how much capacity your rooftop area can accommodate.',
            'Monthly Consumption &ndash; how much capacity you actually need, based on your electricity use.',
            'Run one, then use the switch button to run the other, to check whether your roof can carry the system you need.'
          ]
        )}
        ${stepBlock(
          2,
          'Set your location',
          'Enter your desired location in the search bar or click the Find Current Location button to automatically retrieve your latitude and longitude. You may also click directly on the map to select your site.'
        )}
        ${stepBlock(
          3,
          'Input system details — Solar Rooftop Potential',
          'The input card shows only the fields your chosen procedure needs. For Solar Rooftop Potential, provide the specifications of your rooftop solar system, including:',
          [
            'Roof Area &ndash; the total usable surface area (in square meters) available for solar panel installation. Measure it with the Measure button next to the Roof Area input; the shape can be edited with the buttons on the left.',
            'Tilt &ndash; the angle at which your solar panels are inclined relative to the ground. A flat panel has 0° tilt, while a steeper tilt (e.g., 15°&ndash;30°) may improve sunlight capture.',
            'Orientation (Azimuth) &ndash; the compass direction the panels face, measured in degrees from true north (0° = North, 90° = East, 180° = South, 270° = West). In the Philippines, a 180° (South) orientation is generally optimal.'
          ]
        )}
        ${stepBlock(
          4,
          'Input system details — Monthly Consumption',
          'For Monthly Consumption, the roof-design fields are replaced by a twelve-month usage table:',
          [
            'Electric Bill and Rate &ndash; fill both for a month and the consumption for that month is computed for you.',
            'Consumption (kWh) &ndash; or type the kWh directly if you already know it.',
            'Sun Hours &ndash; filled in automatically for your location, month by month, once a location is set.',
            'Panel Size &ndash; still required, so the calculator can turn the required capacity into a panel count.',
            'One month is enough to get a result, but filling all twelve gives the most accurate sizing.'
          ]
        )}
        ${stepBlock(
          5,
          'How Monthly Consumption is sized',
          'As you fill in the table, live "Solar Capacity" and "Panels" preview cards update above it. Behind them, for every month with data the calculator works out:',
          [
            "Required capacity for that month = consumption ÷ overall efficiency ÷ that month's sun peak hours ÷ days in the month.",
            'The system is then sized to your single highest-demand month, so it still fully covers your peak usage, not just your average.',
            "That capacity is what feeds into Calculate &mdash; the same Summary &amp; Results, System Comparison, What-If Scenarios, and Analysis tabs you'd get from Solar Rooftop Potential."
          ]
        )}
        ${stepBlock(
          6,
          'View results',
          'Click Calculate to generate estimated outputs, including the recommended system capacity, expected energy production, and projected savings.',
          [
            'From Solar Rooftop Potential, the headline capacity is what your roof area can accommodate.',
            'From Monthly Consumption, the headline capacity is what your usage actually requires.',
            'Use the "Switch procedure" button on the results screen to run the other one and compare &mdash; if the rooftop potential meets or exceeds the required capacity, your roof can carry the system you need.'
          ]
        )}
        ${stepBlock(
          7,
          'What-If Scenarios',
          'This feature provides a flexible and interactive environment in which you can modify key assumptions through a slider. Click Apply Configuration to apply changes.'
        )}
        ${stepBlock(
          8,
          'New calculations',
          'For new calculations, either change the location, change some parameters, or click the New Calculation button.'
        )}
      </ul>
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

