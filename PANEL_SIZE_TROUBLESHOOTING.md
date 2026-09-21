# Panel Size Dropdown Troubleshooting Guide

## Issue: Panel Size dropdown not appearing in calculator form

## Step-by-Step Troubleshooting

### Step 1: Restart Development Server
```powershell
# Stop current dev server (Ctrl+C in the terminal)
# Then restart:
cd frontend
npm start
```

**Why?** Sometimes React's hot reload doesn't pick up certain changes, especially with Material UI components.

### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"
4. OR use Ctrl+Shift+R

### Step 3: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any errors related to:
   - Material UI
   - Select component
   - Missing props
   - Import errors

### Step 4: Verify the Dropdown is There
1. Open DevTools (F12)
2. Go to Elements tab
3. Find the Panel Size section
4. Look for elements with these IDs:
   - `panel-size-label`
   - `panel-size-select`

**What to look for:**
- If the elements exist but aren't visible → CSS/styling issue
- If the elements don't exist → Component not rendering
- If there are Material UI class errors → Version mismatch

### Step 5: Test with Default Value
Try setting a default value for panelSize:

In MapComponent.jsx line 130, change:
```javascript
const [panelSize, setPanelSize] = useState('');
```
to:
```javascript
const [panelSize, setPanelSize] = useState('0.5');
```

This will make the dropdown show with 0.5 kWp pre-selected.

### Step 6: Check Material UI Version Compatibility
The Select component changed between Material UI versions. Verify:
```powershell
cd frontend
npm list @mui/material
```

Current version should be 5.x.x

### Step 7: Alternative: Use TextField with Select
If the FormControl Select still doesn't work, we can use TextField with select prop:

```javascript
<TextField
  select
  fullWidth
  size="small"
  label="Panel Size (kWp)"
  value={panelSize}
  onChange={(e) => setPanelSize(e.target.value)}
  sx={getInputStyles(aiFilledFields.panelSize)}
  error={shouldShowError('panelSize', panelSize)}
  onBlur={() => setTouchedFields({ ...touchedFields, panelSize: true })}
>
  {[0.5, 0.55, 0.6, 0.65, 0.7].map((val) => (
    <MenuItem key={val} value={val}>{val} kWp</MenuItem>
  ))}
</TextField>
```

## Common Issues and Fixes

### Issue: Dropdown appears as plain text field
**Cause:** Label prop missing on Select component
**Fix:** Already applied - `label="Panel Size (kWp)"` is present

### Issue: Label overlaps with value
**Cause:** labelId not connected properly
**Fix:** Already applied - labelId matches between InputLabel and Select

### Issue: No dropdown arrow visible
**Cause:** CSS styling overriding Material UI defaults
**Fix:** Check if `getInputStyles()` is interfering

### Issue: Field is completely invisible
**Cause:** Display:none or visibility:hidden in parent
**Fix:** Check Stack spacing and Box display properties

## What the Code Should Look Like Now

```javascript
<Box>
  <FormControl fullWidth size="small" sx={getInputStyles(aiFilledFields.panelSize)} error={shouldShowError('panelSize', panelSize)}>
    <InputLabel id="panel-size-label">Panel Size (kWp)</InputLabel>
    <Select 
      labelId="panel-size-label"
      id="panel-size-select"
      value={panelSize} 
      onChange={(e) => {
        setPanelSize(e.target.value);
        if (aiFilledFields.panelSize) {
          setAiFilledFields(prev => ({ ...prev, panelSize: false }));
        }
      }}
      label="Panel Size (kWp)"
      onBlur={() => setTouchedFields({ ...touchedFields, panelSize: true })}
    >
      {[0.5, 0.55, 0.6, 0.65, 0.7].map((val) => (
        <MenuItem key={val} value={val}>{val} kWp</MenuItem>
      ))}
    </Select>
  </FormControl>
  {aiFilledFields.panelSize && (
    <Chip 
      label="✨ Suggested by AI" 
      size="small" 
      sx={{ 
        mt: 0.5, 
        bgcolor: '#e0f2f1', 
        color: '#00695c',
        fontSize: '0.7rem',
        height: 20
      }} 
    />
  )}
</Box>
```

## Visual Debugging Checklist

When you open the calculator drawer, you should see:

1. **Location Name** (text field)
2. **Latitude** (text field)
3. **Longitude** (text field)
4. **Area** (text field)
5. **Tilt** (text field)
6. **Azimuth** (text field)
7. **Orientation** (info box - if azimuth is filled)
8. **Panel Size** ← THIS SHOULD BE A DROPDOWN
9. **Electricity Rate** (text field)

## If Nothing Works

Try this nuclear option - replace the entire Panel Size section with a simpler version:

```javascript
<TextField
  select
  label="Panel Size (kWp)"
  value={panelSize}
  onChange={(e) => setPanelSize(e.target.value)}
  fullWidth
  size="small"
  SelectProps={{
    native: false,
  }}
>
  <MenuItem value={0.5}>0.5 kWp</MenuItem>
  <MenuItem value={0.55}>0.55 kWp</MenuItem>
  <MenuItem value={0.6}>0.6 kWp</MenuItem>
  <MenuItem value={0.65}>0.65 kWp</MenuItem>
  <MenuItem value={0.7}>0.7 kWp</MenuItem>
</TextField>
```

## Next Steps

1. Restart dev server
2. Hard refresh browser
3. Check console for errors
4. Inspect elements to see if dropdown exists
5. If still not working, share screenshot or console errors

The dropdown should appear with a downward arrow icon on the right side, just like other Material UI Select components.

