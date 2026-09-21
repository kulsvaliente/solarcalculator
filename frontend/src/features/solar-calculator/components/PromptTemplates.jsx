import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ElectricBolt as ElectricIcon,
  Home as HomeIcon,
  Nature as EcoIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const PromptTemplates = ({ open, onClose, onSelectPrompt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const promptCategories = [
    {
      id: 'bill-analysis',
      title: 'Electricity Bill Analysis',
      icon: <ElectricIcon />,
      color: '#1976d2',
      prompts: [
        {
          title: 'Monthly Bill Analysis',
          template: 'My electricity bill is {amount} pesos per month and I live in {location}, how much would it cost to build a hybrid system with net metering to make my bill zero?',
          variables: ['amount', 'location'],
          example: 'My electricity bill is 5,000 pesos per month and I live in Batac City, Ilocos Norte, how much would it cost to build a hybrid system with net metering to make my bill zero?'
        },
        {
          title: 'High Bill Investigation',
          template: 'My electricity bill is {amount} pesos per month for a {property_type} in {location}. What could be causing this high consumption and how can solar help reduce it?',
          variables: ['amount', 'property_type', 'location'],
          example: 'My electricity bill is 8,000 pesos per month for a 3-bedroom house in Quezon City. What could be causing this high consumption and how can solar help reduce it?'
        },
        {
          title: 'Bill Breakdown Analysis',
          template: 'Help me understand my electricity bill of {amount} pesos. What are the main cost components and how much could I save with a {system_type} solar system?',
          variables: ['amount', 'system_type'],
          example: 'Help me understand my electricity bill of 6,500 pesos. What are the main cost components and how much could I save with a grid-tied solar system?'
        }
      ]
    },
    {
      id: 'system-sizing',
      title: 'System Sizing & Design',
      icon: <BuildIcon />,
      color: '#2e7d32',
      prompts: [
        {
          title: 'Residential System Sizing',
          template: 'I have a {property_type} in {location} with {area} square meters roof space. What size solar system do I need for {usage} kWh monthly consumption?',
          variables: ['property_type', 'location', 'area', 'usage'],
          example: 'I have a 2-story house in Cebu City with 80 square meters roof space. What size solar system do I need for 400 kWh monthly consumption?'
        },
        {
          title: 'Commercial System Planning',
          template: 'I own a {business_type} in {location} with {area} square meters of roof space. We consume {usage} kWh monthly. What solar system configuration would work best?',
          variables: ['business_type', 'location', 'area', 'usage'],
          example: 'I own a small restaurant in Makati with 120 square meters of roof space. We consume 1,200 kWh monthly. What solar system configuration would work best?'
        },
        {
          title: 'Off-Grid System Design',
          template: 'I want to go completely off-grid in {location}. My daily consumption is {usage} kWh. What solar system with battery storage do I need?',
          variables: ['location', 'usage'],
          example: 'I want to go completely off-grid in Palawan. My daily consumption is 15 kWh. What solar system with battery storage do I need?'
        }
      ]
    },
    {
      id: 'financial-analysis',
      title: 'Financial Analysis',
      icon: <MoneyIcon />,
      color: '#ed6c02',
      prompts: [
        {
          title: 'ROI Calculation',
          template: 'Calculate the return on investment for a {capacity} kW solar system in {location}. My current electricity rate is {rate} pesos per kWh.',
          variables: ['capacity', 'location', 'rate'],
          example: 'Calculate the return on investment for a 5 kW solar system in Davao City. My current electricity rate is 12.50 pesos per kWh.'
        },
        {
          title: 'Payback Period Analysis',
          template: 'How long will it take to break even on a solar investment of {investment} pesos for a {capacity} kW system in {location}?',
          variables: ['investment', 'capacity', 'location'],
          example: 'How long will it take to break even on a solar investment of 350,000 pesos for a 6 kW system in Iloilo City?'
        },
        {
          title: 'Financing Options',
          template: 'What are the best financing options for a {capacity} kW solar system? I can pay {budget} pesos upfront and need financing for the rest.',
          variables: ['capacity', 'budget'],
          example: 'What are the best financing options for a 8 kW solar system? I can pay 200,000 pesos upfront and need financing for the rest.'
        }
      ]
    },
    {
      id: 'technical-guidance',
      title: 'Technical Guidance',
      icon: <BuildIcon />,
      color: '#9c27b0',
      prompts: [
        {
          title: 'Panel Selection',
          template: 'What type of solar panels should I choose for {location}? I need {capacity} kW and have {budget} pesos budget.',
          variables: ['location', 'capacity', 'budget'],
          example: 'What type of solar panels should I choose for Baguio City? I need 4 kW and have 300,000 pesos budget.'
        },
        {
          title: 'Inverter Comparison',
          template: 'Should I choose a string inverter, microinverter, or power optimizer system for my {capacity} kW installation in {location}?',
          variables: ['capacity', 'location'],
          example: 'Should I choose a string inverter, microinverter, or power optimizer system for my 7 kW installation in Tagaytay?'
        },
        {
          title: 'Installation Requirements',
          template: 'What are the installation requirements and permits needed for a {capacity} kW solar system in {location}?',
          variables: ['capacity', 'location'],
          example: 'What are the installation requirements and permits needed for a 5 kW solar system in Bacolod City?'
        }
      ]
    },
    {
      id: 'location-specific',
      title: 'Location-Specific',
      icon: <HomeIcon />,
      color: '#f57c00',
      prompts: [
        {
          title: 'Weather Impact',
          template: 'How does the weather in {location} affect solar panel performance? What should I consider for a {capacity} kW system?',
          variables: ['location', 'capacity'],
          example: 'How does the weather in Tacloban City affect solar panel performance? What should I consider for a 6 kW system?'
        },
        {
          title: 'Local Incentives',
          template: 'What solar incentives and programs are available in {location}? I\'m planning a {capacity} kW residential system.',
          variables: ['location', 'capacity'],
          example: 'What solar incentives and programs are available in Cagayan de Oro? I\'m planning a 4 kW residential system.'
        },
        {
          title: 'Installation Costs',
          template: 'How do installation costs differ in {location} compared to Metro Manila? I need a {capacity} kW system.',
          variables: ['location', 'capacity'],
          example: 'How do installation costs differ in Dumaguete compared to Metro Manila? I need a 5 kW system.'
        }
      ]
    },
    {
      id: 'maintenance-troubleshooting',
      title: 'Maintenance & Troubleshooting',
      icon: <EcoIcon />,
      color: '#388e3c',
      prompts: [
        {
          title: 'Performance Issues',
          template: 'My {capacity} kW solar system in {location} is only producing {current_production} kWh monthly instead of the expected {expected_production} kWh. What could be wrong?',
          variables: ['capacity', 'location', 'current_production', 'expected_production'],
          example: 'My 5 kW solar system in Angeles City is only producing 400 kWh monthly instead of the expected 600 kWh. What could be wrong?'
        },
        {
          title: 'Maintenance Schedule',
          template: 'What maintenance does my {capacity} kW solar system need in {location}? How often should I clean the panels?',
          variables: ['capacity', 'location'],
          example: 'What maintenance does my 6 kW solar system need in Puerto Princesa? How often should I clean the panels?'
        },
        {
          title: 'Warranty Questions',
          template: 'My solar panels are {age} years old and showing {issue}. What does the warranty cover and what are my options?',
          variables: ['age', 'issue'],
          example: 'My solar panels are 3 years old and showing reduced efficiency. What does the warranty cover and what are my options?'
        }
      ]
    }
  ];

  const filteredPrompts = promptCategories
    .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
    .map(category => ({
      ...category,
      prompts: category.prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.example.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.prompts.length > 0);

  const handlePromptSelect = (template, example) => {
    onSelectPrompt(example);
    onClose();
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const replaceVariables = (template, variables) => {
    let result = template;
    variables.forEach(variable => {
      const placeholder = `{${variable}}`;
      const inputValue = prompt(`Enter value for ${variable}:`) || `[${variable}]`;
      result = result.replace(placeholder, inputValue);
    });
    return result;
  };

  const handleCustomizePrompt = (template, variables) => {
    const customizedPrompt = replaceVariables(template, variables);
    onSelectPrompt(customizedPrompt);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Solar Calculator Prompt Templates
          </Typography>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Search and Filter */}
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            <Chip
              label="All Categories"
              onClick={() => setSelectedCategory('all')}
              color={selectedCategory === 'all' ? 'primary' : 'default'}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
            />
            {promptCategories.map(category => (
              <Chip
                key={category.id}
                label={category.title}
                onClick={() => setSelectedCategory(category.id)}
                color={selectedCategory === category.id ? 'primary' : 'default'}
                variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                icon={category.icon}
              />
            ))}
          </Box>
        </Box>

        {/* Prompt Categories */}
        {filteredPrompts.map(category => (
          <Accordion key={category.id} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box color={category.color}>{category.icon}</Box>
                <Typography variant="h6">{category.title}</Typography>
                <Chip 
                  label={category.prompts.length} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={2}>
                {category.prompts.map((prompt, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {prompt.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          <strong>Template:</strong> {prompt.template}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          <strong>Example:</strong> {prompt.example}
                        </Typography>
                        
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handlePromptSelect(prompt.template, prompt.example)}
                            startIcon={<CopyIcon />}
                          >
                            Use Example
                          </Button>
                          
                          {prompt.variables.length > 0 && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleCustomizePrompt(prompt.template, prompt.variables)}
                            >
                              Customize
                            </Button>
                          )}
                          
                          <Tooltip title="Copy to clipboard">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyToClipboard(prompt.example)}
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
        
        {filteredPrompts.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No prompts found matching your search
            </Typography>
            <Button onClick={() => setSearchTerm('')} sx={{ mt: 2 }}>
              Clear Search
            </Button>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptTemplates;
