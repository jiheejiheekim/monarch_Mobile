import React from 'react';
import { Button, Grid, Stack } from '@mui/material';

interface FilterButtonsProps {
  onSearch: () => void;
  onReset: () => void;
  isMobile: boolean;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ onSearch, onReset, isMobile }) => {
  if (isMobile) {
    return (
      <Grid item xs={12}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button variant="contained" onClick={onSearch} fullWidth>
            조회
            </Button>
            <Button variant="outlined" onClick={onReset} fullWidth>
            초기화
            </Button>
        </Stack>
      </Grid>
    );
  }

  return (
    <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%', pt: 1 }}>
        <Grid item>
            <Button variant="contained" onClick={onSearch} sx={{ padding: '8px 24px' }}>
            조회
            </Button>
        </Grid>
        <Grid item>
            <Button variant="outlined" onClick={onReset} sx={{ padding: '8px 24px' }}>
            초기화
            </Button>
        </Grid>
    </Grid>
  );
};

export default FilterButtons;