import React from 'react';
import { Button, Grid, Stack } from '@mui/material';

import type { ButtonConfig } from './DynamicGridWidget';

interface FilterButtonsProps {
  onSearch: () => void;
  onReset: () => void;
  isMobile: boolean;
  buttons?: ButtonConfig[];
  onButtonClick?: (btn: ButtonConfig) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ onSearch, onReset, isMobile, buttons, onButtonClick }) => {
  const getClickHandler = (btn: ButtonConfig) => {
    switch (btn.inComm) {
      case 'List': return onSearch;
      case 'initialize': return onReset;
      default: return () => onButtonClick?.(btn);
    }
  };

  const renderButtons = () => {
    if (buttons && buttons.length > 0) {
      return buttons.map((btn) => {
        const handler = getClickHandler(btn);

        // No checks needed here, because default returns generic handler

        const isPrimary = btn.inComm === 'List';
        return (
          <Button
            key={btn.index}
            variant={isPrimary ? "contained" : "outlined"}
            onClick={handler}
            fullWidth={isMobile}
            sx={!isMobile ? { padding: '8px 24px', minWidth: 100 } : undefined}
          >
            {btn.label}
          </Button>
        );
      });
    }

    // Default buttons if no config provided
    return (
      <>
        <Button
          variant="contained"
          onClick={onSearch}
          fullWidth={isMobile}
          sx={!isMobile ? { padding: '8px 24px', minWidth: 100 } : undefined}
        >
          조회
        </Button>
        <Button
          variant="outlined"
          onClick={onReset}
          fullWidth={isMobile}
          sx={!isMobile ? { padding: '8px 24px', minWidth: 100 } : undefined}
        >
          초기화
        </Button>
      </>
    );
  };

  if (isMobile) {
    return (
      <Grid item xs={12}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          {renderButtons()}
        </Stack>
      </Grid>
    );
  }

  return (
    <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%', pt: 1 }}>
      {buttons && buttons.length > 0 ? (
        buttons.map((btn) => {
          const handler = getClickHandler(btn);
          const isPrimary = btn.inComm === 'List';
          return (
            <Grid item key={btn.index}>
              <Button
                variant={isPrimary ? "contained" : "outlined"}
                onClick={handler}
                sx={{ padding: '8px 24px', minWidth: 100 }}
              >
                {btn.label}
              </Button>
            </Grid>
          )
        })
      ) : (
        <>
          <Grid item>
            <Button variant="contained" onClick={onSearch} sx={{ padding: '8px 24px', minWidth: 100 }}>
              조회
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={onReset} sx={{ padding: '8px 24px', minWidth: 100 }}>
              초기화
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default FilterButtons;