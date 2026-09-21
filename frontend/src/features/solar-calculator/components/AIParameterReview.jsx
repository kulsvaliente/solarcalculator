/**
 * AI Parameter Review Component
 * 
 * A beautiful modal/dialog that displays all extracted parameters from the AI conversation
 * for user review before applying them to the solar calculator. Provides inline editing,
 * confidence indicators, and validation feedback.
 * 
 * @module AIParameterReview
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  LinearProgress,
  Grid,
  Tooltip,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Clear as CancelIcon,
  LocationOn as LocationIcon,
  Straighten as RulerIcon,
  AttachMoney as MoneyIcon,
  Settings as TechnicalIcon,
  AutoAwesome as AIIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';

/**
 * AI Parameter Review Dialog Component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object} props.parameters - Extracted parameters object from conversation context
 * @param {Function} props.onApply - Callback when user applies parameters to calculator
 * @param {Function} props.onClose - Callback when user closes the dialog
 * @param {Function} props.onEdit - Callback when user edits a parameter value
 * @returns {JSX.Element} AI Parameter Review dialog
 */
const AIParameterReview = ({ open, parameters, onApply, onClose, onEdit }) => {
  // Track which parameter is currently being edited
  const [editingParam, setEditingParam] = useState(null);
  
  // Track temporary edit values
  const [editValues, setEditValues] = useState({});

  /**
   * Get confidence color based on confidence score
   * High confidence: teal, Medium: blue, Low: orange
   * 
   * @param {number} confidence - Confidence score (0-1)
   * @returns {Object} Color scheme object
   */
  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) {
      return { 
        bg: '#e0f2f1', 
        border: '#26a69a', 
        text: '#00695c',
        label: 'High Confidence' 
      }; // Teal for high confidence
    }
    if (confidence > 0.5) {
      return { 
        bg: '#e3f2fd', 
        border: '#42a5f5', 
        text: '#1565c0',
        label: 'Medium Confidence' 
      }; // Blue for medium confidence
    }
    return { 
      bg: '#fff3e0', 
      border: '#ff9800', 
      text: '#e65100',
      label: 'Low Confidence - Please Verify' 
    }; // Orange for low confidence
  };

  /**
   * Handle starting edit mode for a parameter
   * 
   * @param {string} paramKey - Key of the parameter being edited
   * @param {*} currentValue - Current value of the parameter
   */
  const handleStartEdit = (paramKey, currentValue) => {
    setEditingParam(paramKey);
    setEditValues({ ...editValues, [paramKey]: currentValue });
  };

  /**
   * Handle saving edited parameter value
   * 
   * @param {string} paramKey - Key of the parameter being saved
   */
  const handleSaveEdit = (paramKey) => {
    if (onEdit) {
      onEdit(paramKey, editValues[paramKey]);
    }
    setEditingParam(null);
  };

  /**
   * Handle canceling edit mode
   */
  const handleCancelEdit = () => {
    setEditingParam(null);
    setEditValues({});
  };

  /**
   * Render a parameter card with edit capability
   * 
   * @param {string} title - Parameter title
   * @param {*} value - Parameter value
   * @param {string} unit - Unit of measurement
   * @param {number} confidence - Confidence score
   * @param {JSX.Element} icon - Icon component
   * @param {string} paramKey - Parameter key for editing
   * @param {string} sourceQuote - Quote from conversation that extracted this parameter
   * @returns {JSX.Element|null} Parameter card or null if no value
   */
  const renderParameterCard = (title, value, unit, confidence, icon, paramKey, sourceQuote = null) => {
    if (!value && value !== 0) return null;

    const colors = getConfidenceColor(confidence);
    const isEditing = editingParam === paramKey;

    return (
      <Zoom in={true} timeout={300}>
        <Card sx={{ 
          mb: 2, 
          border: `2px solid ${colors.border}`,
          bgcolor: colors.bg,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 8px 24px ${colors.border}40`,
            transform: 'translateY(-2px)'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: colors.text }}>
                  {icon}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: colors.text }}>
                  {title}
                </Typography>
              </Box>
              {!isEditing && (
                <Tooltip title="Edit value" arrow>
                  <IconButton 
                    size="small" 
                    onClick={() => handleStartEdit(paramKey, value)}
                    sx={{ color: colors.text }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {isEditing ? (
              // Edit mode - show input field
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={editValues[paramKey] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [paramKey]: e.target.value })}
                  fullWidth
                  autoFocus
                  sx={{ bgcolor: 'white' }}
                />
                <IconButton 
                  size="small" 
                  color="success" 
                  onClick={() => handleSaveEdit(paramKey)}
                >
                  <CheckIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={handleCancelEdit}
                >
                  <CancelIcon />
                </IconButton>
              </Box>
            ) : (
              // Display mode - show value
              <>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text, mb: 1 }}>
                  {value} {unit}
                </Typography>
                
                {/* Confidence indicator */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 'bold' }}>
                      {colors.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text, fontWeight: 'bold' }}>
                      {(confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={confidence * 100} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'white',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.border
                      }
                    }} 
                  />
                </Box>

                {/* Source quote from conversation */}
                {sourceQuote && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    bgcolor: 'white', 
                    borderRadius: 2,
                    border: `1px solid ${colors.border}40`
                  }}>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#666' }}>
                      "...{sourceQuote}..."
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  // Check if we have any parameters to display
  const hasParameters = parameters && (
    parameters.location?.confidence > 0 ||
    parameters.area?.confidence > 0 ||
    parameters.financial?.confidence > 0 ||
    parameters.technical?.confidence > 0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #00acc1 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
          pointerEvents: 'none'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AIIcon />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Review AI-Extracted Parameters
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        {!hasParameters ? (
          // No parameters extracted message
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            bgcolor: '#f5f5f5',
            borderRadius: 3
          }}>
            <AIIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Parameters Extracted Yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start chatting with cAIre (Chat AI for Renewable Energy) and mention your solar requirements.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              For example: "I have a 50 sqm roof in Manila with a budget of ₱200,000"
            </Typography>
          </Box>
        ) : (
          // Display extracted parameters organized by category
          <Grid container spacing={2}>
            {/* Location Section */}
            {parameters.location?.confidence > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: '#1976d2'
                }}>
                  <LocationIcon />
                  Location
                </Typography>
                {renderParameterCard(
                  'City / Province',
                  parameters.location.city || 'Coordinates',
                  parameters.location.province ? `(${parameters.location.province})` : '',
                  parameters.location.confidence,
                  <LocationIcon fontSize="small" />,
                  'location',
                  parameters.location.city
                )}
                {parameters.location.lat && parameters.location.lng && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: -1, mb: 2, ml: 2 }}>
                    Coordinates: {parameters.location.lat.toFixed(4)}, {parameters.location.lng.toFixed(4)}
                  </Typography>
                )}
              </Grid>
            )}

            {/* Dimensions Section */}
            {parameters.area?.confidence > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: '#00796b'
                }}>
                  <RulerIcon />
                  Dimensions
                </Typography>
                {renderParameterCard(
                  'Roof Area',
                  parameters.area.value,
                  'sqm',
                  parameters.area.confidence,
                  <RulerIcon fontSize="small" />,
                  'area',
                  `${parameters.area.value} ${parameters.area.unit}`
                )}
                {parameters.area.width && parameters.area.length && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: -1, ml: 2 }}>
                    Dimensions: {parameters.area.width}m × {parameters.area.length}m
                  </Typography>
                )}
              </Grid>
            )}

            {/* Financial Section */}
            {parameters.financial?.confidence > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: '#2e7d32'
                }}>
                  <MoneyIcon />
                  Financial
                </Typography>
                {parameters.financial.budget && renderParameterCard(
                  'Budget',
                  `₱${parameters.financial.budget.toLocaleString()}`,
                  '',
                  parameters.financial.confidence,
                  <MoneyIcon fontSize="small" />,
                  'budget',
                  `₱${parameters.financial.budget.toLocaleString()}`
                )}
                {parameters.financial.monthlyBill && renderParameterCard(
                  'Monthly Electricity Bill',
                  `₱${parameters.financial.monthlyBill.toLocaleString()}`,
                  '/month',
                  parameters.financial.confidence,
                  <MoneyIcon fontSize="small" />,
                  'monthlyBill',
                  `₱${parameters.financial.monthlyBill.toLocaleString()}`
                )}
              </Grid>
            )}

            {/* Technical Section */}
            {parameters.technical?.confidence > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: '#7b1fa2'
                }}>
                  <TechnicalIcon />
                  Technical Specifications
                </Typography>
                <Grid container spacing={2}>
                  {parameters.technical.tilt !== null && (
                    <Grid item xs={12} md={6}>
                      {renderParameterCard(
                        'Panel Tilt Angle',
                        parameters.technical.tilt,
                        '°',
                        parameters.technical.confidence,
                        <TechnicalIcon fontSize="small" />,
                        'tilt',
                        `${parameters.technical.tilt}° tilt`
                      )}
                    </Grid>
                  )}
                  {parameters.technical.azimuth !== null && (
                    <Grid item xs={12} md={6}>
                      {renderParameterCard(
                        'Panel Orientation',
                        `${parameters.technical.azimuth}° (${parameters.technical.orientation || 'N/A'})`,
                        '',
                        parameters.technical.confidence,
                        <TechnicalIcon fontSize="small" />,
                        'azimuth',
                        `facing ${parameters.technical.orientation}`
                      )}
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: '#f5f5f5',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Button
          onClick={onClose}
          startIcon={<ResetIcon />}
          sx={{ 
            color: '#666',
            '&:hover': { bgcolor: '#e0e0e0' }
          }}
        >
          Start Over
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderColor: '#999',
            color: '#666',
            '&:hover': { 
              borderColor: '#666',
              bgcolor: '#f5f5f5'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (onApply) {
              onApply(parameters);
            }
            onClose();
          }}
          variant="contained"
          startIcon={<CheckIcon />}
          sx={{
            bgcolor: '#00897b',
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: '#00695c',
              transform: 'scale(1.02)',
              boxShadow: '0 8px 24px rgba(0,137,123,0.4)'
            },
            transition: 'all 0.3s ease-in-out',
            '&:disabled': {
              bgcolor: '#ccc',
              color: '#999'
            }
          }}
        >
          Apply to Calculator
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIParameterReview;

