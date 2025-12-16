import React from 'react';
import {
    Paper, Grid, Stack, TextField, Typography, Box,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import type {
    ProcessedRow, FilterItem, FilterValue
} from './types';
import PopupFilterInput from '../PopupFilterInput';
import type { PopupFilter } from '../PopupFilterInput';
import FilterButtons from '../FilterButtons';
import type { ButtonConfig } from './types';

interface GridFiltersProps {
    processedFilters: ProcessedRow[];
    searchFilters: Record<string, string>;
    dateFilterValues: Record<string, { from?: string; to?: string }>;
    popupFilterValues: Record<string, { value?: FilterValue; display?: string }>;
    groupSelections: Record<string, string>;
    totalColumns: number;
    isMobile: boolean;
    buttons?: ButtonConfig[];
    onUngroupedFilterChange: (field: string, value: string) => void;
    onGroupedSelectChange: (groupName: string, field: string) => void;
    onGroupedValueChange: (groupName: string, value: string) => void;
    onDateFilterChange: (field: string, value: string, type: 'from' | 'to') => void;
    onPopupOpen: (filter: PopupFilter) => void;
    onPopupClear: (field: string) => void;
    onSearch: () => void;
    onReset: () => void;
    onButtonClick: (btn: ButtonConfig) => void;
}

/**
 * 그리드 필터 섹션 컴포넌트
 * 검색 조건 입력 및 버튼 제공
 */
export const GridFilters: React.FC<GridFiltersProps> = ({
    processedFilters,
    searchFilters,
    dateFilterValues,
    popupFilterValues,
    groupSelections,
    totalColumns,
    isMobile,
    buttons,
    onUngroupedFilterChange,
    onGroupedSelectChange,
    onGroupedValueChange,
    onDateFilterChange,
    onPopupOpen,
    onPopupClear,
    onSearch,
    onReset,
    onButtonClick
}) => {

    // 개별 필터 컨트롤 렌더링
    const renderFilterControl = (filter: FilterItem) => {
        const filterType = filter.type || 'text';

        switch (filterType) {
            case 'dateBetween':
                return (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            label={`${filter.label}_FROM`}
                            type="date"
                            variant="outlined"
                            value={dateFilterValues[filter.field]?.from || ''}
                            onChange={e => onDateFilterChange(filter.field, e.target.value, 'from')}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <Typography sx={{ mx: 1 }}>~</Typography>
                        <TextField
                            label={`${filter.label}_TO`}
                            type="date"
                            variant="outlined"
                            value={dateFilterValues[filter.field]?.to || ''}
                            onChange={e => onDateFilterChange(filter.field, e.target.value, 'to')}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Stack>
                );

            case 'popup': {
                const popupFilter = filter as PopupFilter;
                return (
                    <PopupFilterInput
                        filter={popupFilter}
                        displayValue={popupFilterValues[popupFilter.field]?.display}
                        onOpenPopup={() => onPopupOpen(popupFilter)}
                        onClear={() => onPopupClear(popupFilter.field)}
                    />
                );
            }

            default: // 일반 텍스트 필터
                return (
                    <TextField
                        label={filter.label}
                        variant="outlined"
                        type={filterType === 'date' ? 'date' : 'search'}
                        value={searchFilters[filter.field] || ''}
                        onChange={e => onUngroupedFilterChange(filter.field, e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && onSearch()}
                        InputLabelProps={{ shrink: filterType === 'date' || !!searchFilters[filter.field] }}
                        fullWidth
                    />
                );
        }
    };

    // 모바일 레이아웃
    if (isMobile) {
        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container gap={2}>
                    {processedFilters.map(row => (
                        <Grid item xs={12} key={row.key}>
                            <Grid container gap={1}>
                                {row.units.map(unit => {
                                    if (unit.type === 'group') {
                                        const { groupName, items } = unit;
                                        const selectedField = groupSelections[groupName] || items[0]?.field;
                                        const value = searchFilters[selectedField] || '';

                                        return (
                                            <Grid item xs={12} key={unit.key}>
                                                <Stack direction="column" spacing={1}>
                                                    <FormControl variant="outlined" fullWidth>
                                                        <InputLabel>검색항목</InputLabel>
                                                        <Select
                                                            value={selectedField}
                                                            label="검색항목"
                                                            onChange={e => onGroupedSelectChange(groupName, e.target.value)}
                                                        >
                                                            {items.map(item => (
                                                                <MenuItem key={item.field} value={item.field}>
                                                                    {item.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <TextField
                                                        fullWidth
                                                        label="검색어"
                                                        variant="outlined"
                                                        value={value}
                                                        onChange={e => onGroupedValueChange(groupName, e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && onSearch()}
                                                    />
                                                </Stack>
                                            </Grid>
                                        );
                                    } else {
                                        return (
                                            <Grid item xs={12} key={unit.key}>
                                                {renderFilterControl(unit.item)}
                                            </Grid>
                                        );
                                    }
                                })}
                            </Grid>
                        </Grid>
                    ))}
                    <Grid item xs={12}>
                        <FilterButtons
                            onSearch={onSearch}
                            onReset={onReset}
                            onButtonClick={onButtonClick}
                            isMobile={isMobile}
                            buttons={buttons}
                        />
                    </Grid>
                </Grid>
            </Paper>
        );
    }

    // Desktop 레이아웃
    return (
        <Paper sx={{ mb: 2, p: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        {processedFilters.map(row => (
                            <Grid container spacing={1} key={row.key} alignItems="center" sx={{ width: '100%', m: 0 }}>
                                {row.units.map(unit => {
                                    if (unit.type === 'group') {
                                        const { groupName, items } = unit;
                                        const selectedField = groupSelections[groupName] || items[0]?.field;
                                        const selectedItem = items.find(item => item.field === selectedField);
                                        const colspan = selectedItem?.colspan ? Number(selectedItem.colspan) : 1;
                                        const mdSize = Math.max(1, Math.round((colspan / totalColumns) * 12));
                                        const value = searchFilters[selectedField] || '';

                                        return (
                                            <Grid item xs={12} md={mdSize} key={unit.key}>
                                                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                                    <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                        <InputLabel>검색항목</InputLabel>
                                                        <Select
                                                            value={selectedField}
                                                            label="검색항목"
                                                            onChange={e => onGroupedSelectChange(groupName, e.target.value)}
                                                        >
                                                            {items.map(item => (
                                                                <MenuItem key={item.field} value={item.field}>
                                                                    {item.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <TextField
                                                        fullWidth
                                                        label="검색어"
                                                        variant="outlined"
                                                        value={value}
                                                        onChange={e => onGroupedValueChange(groupName, e.target.value)}
                                                        onKeyPress={e => e.key === 'Enter' && onSearch()}
                                                    />
                                                </Stack>
                                            </Grid>
                                        );
                                    } else {
                                        const colspan = unit.item.colspan ? Number(unit.item.colspan) : 1;
                                        const mdSize = Math.max(1, Math.round((colspan / totalColumns) * 12));
                                        return (
                                            <Grid item xs={12} md={mdSize} key={unit.key}>
                                                {renderFilterControl(unit.item)}
                                            </Grid>
                                        );
                                    }
                                })}
                            </Grid>
                        ))}
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <FilterButtons
                            onSearch={onSearch}
                            onReset={onReset}
                            onButtonClick={onButtonClick}
                            isMobile={isMobile}
                            buttons={buttons}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
};
