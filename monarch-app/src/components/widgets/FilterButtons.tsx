import React from 'react';
import { Button, Grid, Stack } from '@mui/material';

import type { ButtonConfig } from './DynamicGridWidget';

/**
 * FilterButtons Props
 * @property onSearch - Callback for search action
 * @property onReset - Callback for reset action
 * @property isMobile - Boolean flag for mobile layout
 * @property buttons - Array of button configurations
 * @property onButtonClick - Callback for custom button clicks
 */
interface FilterButtonsProps {
  onSearch: () => void;
  onReset: () => void;
  isMobile: boolean;
  buttons?: ButtonConfig[];
  onButtonClick?: (btn: ButtonConfig) => void;
}

/**
 * FilterButtons Component
 * 
 * Renders the action buttons (Search, Reset, etc.) for the Grid.
 * Handles responsive layout:
 * - Desktop: Horizontal row of buttons.
 * - Mobile: 
 *   - 'Search' button takes full width at the bottom.
 *   - Other buttons are arranged in a row above 'Search'.
 *   - Filters buttons based on `mobileAllow` property (except for 'Search' and 'Reset').
 */
const FilterButtons: React.FC<FilterButtonsProps> = ({ onSearch, onReset, isMobile, buttons, onButtonClick }) => {

  /**
   * Helper to determine the click handler for a button.
   * Maps 'List' to onSearch, 'initialize' to onReset, and others to onButtonClick.
   */
  const getClickHandler = (btn: ButtonConfig) => {
    switch (btn.inComm) {
      case 'List': return onSearch;
      case 'initialize': return onReset;
      default: return () => onButtonClick?.(btn);
    }
  };

  // --- Mobile Rendering Logic ---
  if (isMobile) {
    let buttonsToRender = buttons || [];

    // 1. Ensure default buttons exist if configuration is empty
    let activeButtons = buttonsToRender;
    if (!buttons || buttons.length === 0) {
      activeButtons = [
        { label: '조회', index: 'List', inComm: 'List' },
        { label: '초기화', index: 'Init', inComm: 'initialize' }
      ];
    }

    // 2. Filter buttons for mobile visibility
    // - Show if mobileAllow is true
    // - ALWAYS show 'Search' (List) and 'Reset' (initialize)
    activeButtons = activeButtons.filter(btn =>
      String(btn.mobileAllow) === 'true' ||
      btn.inComm === 'List' ||
      btn.inComm === 'initialize'
    );

    const searchBtnConfig = activeButtons.find(btn => btn.inComm === 'List');
    const otherBtnConfigs = activeButtons.filter(btn => btn.inComm !== 'List');

    return (
      <Grid item xs={12}>
        <Stack spacing={1} sx={{ width: '100%' }}>
          {/* Row for secondary buttons (Reset, Excel, etc.) */}
          {otherBtnConfigs.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              {otherBtnConfigs.map(btn => (
                <Button
                  key={btn.index}
                  variant="outlined"
                  onClick={getClickHandler(btn)}
                  fullWidth
                >
                  {btn.label}
                </Button>
              ))}
            </Stack>
          )}

          {/* Full-width Search Button at the bottom */}
          {searchBtnConfig && (
            <Button
              key={searchBtnConfig.index}
              variant="contained"
              onClick={getClickHandler(searchBtnConfig)}
              fullWidth
              sx={{ py: 1.2, fontWeight: 'bold' }}
            >
              {searchBtnConfig.label}
            </Button>
          )}
        </Stack>
      </Grid>
    );
  }

  // --- Desktop Rendering Logic ---
  return (
    <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%', pt: 1 }}>
      {buttons && buttons.length > 0 ? (
        // Render configured buttons
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
        // Render default Search/Reset buttons if no config
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