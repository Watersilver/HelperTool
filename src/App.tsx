import { Box, CssBaseline, Divider, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography, useColorScheme } from '@mui/material'
import CombatSim from './CombatSim'

function ColorModeChooser() {
  const { mode, setMode } = useColorScheme();
  return <FormControl>
    <FormLabel id="demo-theme-toggle">Theme</FormLabel>
    <RadioGroup
      aria-labelledby="demo-theme-toggle"
      name="theme-toggle"
      row
      value={mode}
      onChange={(event) =>
        setMode(event.target.value as 'system' | 'light' | 'dark')
      }
    >
      <FormControlLabel value="system" control={<Radio />} label="System" />
      <FormControlLabel value="light" control={<Radio />} label="Light" />
      <FormControlLabel value="dark" control={<Radio />} label="Dark" />
    </RadioGroup>
  </FormControl>;
}

export default function App() {
  const { mode } = useColorScheme();
  if (!mode) {
    return null;
  }
  return (
    <>
      <CssBaseline />
      <Stack direction='row'>
        <Typography sx={{flexGrow: 1}} variant='h3' textAlign='center'>
          Combat Sim
        </Typography>
        <Divider orientation="vertical" flexItem variant="middle" />
        <Box sx={{pl: 1}}>
          <ColorModeChooser />
        </Box>
      </Stack>
      <Divider/>
      <CombatSim/>
    </>
  );
}
