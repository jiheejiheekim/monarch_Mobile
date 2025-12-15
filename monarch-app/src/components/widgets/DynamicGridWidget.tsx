import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Widget from "../Widget";
import PopupFilterInput from './PopupFilterInput';
import type { PopupFilter } from './PopupFilterInput';
import PopupGrid from "./PopupGrid";

import {
    useTheme, useMediaQuery, Box, Stack, TextField, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Card, CardContent, Typography, Pagination as MuiPagination, CircularProgress, Alert,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Grid } from '@mui/material';

// --- Interface Definitions ---

interface ColModel {
    label: string;
    field: string;
    type?: 'text' | 'date' | 'number';
    align: 'left' | 'center' | 'right';
    labelAlign?: 'left' | 'center' | 'right';
}

type BaseFilterItem = {
    label: string;
    field: string;
    type?: 'text' | 'select' | 'date' | 'dateBetween';
    groupName?: string;
    colspan?: number | string;
};

type FilterItem = BaseFilterItem | PopupFilter;

type TextFilterItem = BaseFilterItem & { type: 'text' };

interface FilterRow {
    TD: FilterItem[];
}

interface ColGroup {
    index: string;
    Width: string;
}

interface StructureConfig {
    title: string;
    colgroup?: ColGroup[];
    filterView: (FilterItem | FilterRow)[];
    colModel: ColModel[];
    service: string;
    method: string;
    keyName: string;
    order: string;
}

interface GridRow {
    [key: string]: string | number | boolean | null | undefined;
}

type FilterValue = string | number | boolean | null | undefined;

interface DynamicGridWidgetProps {
    structureName: string;
    onRowClick?: (row: GridRow) => void;
}

// --- Helper Types for Processed Filters ---

type RenderableUnit =

    | { type: 'single'; item: FilterItem; key: string; }

    | { type: 'group'; groupName: string; items: TextFilterItem[]; key: string; };



interface ProcessedRow {

    key: string;

    units: RenderableUnit[];

}



const DynamicGridWidget: React.FC<DynamicGridWidgetProps> = ({ structureName, onRowClick }) => {

    // --- State Management ---

    const [structureConfig, setStructureConfig] = useState<StructureConfig | null>(null);

    const [gridData, setGridData] = useState<GridRow[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);

    const [totalCount, setTotalCount] = useState(0);

    const [pageSize, setPageSize] = useState(10);

    

    // Unified state for all key-value filters

    const [searchFilters, setSearchFilters] = useState<{ [key: string]: string }>({});

    // State for date range filters

    const [dateFilterValues, setDateFilterValues] = useState<{ [key: string]: { from?: string, to?: string } }>({});

    // State for popup filters

    const [popupFilterValues, setPopupFilterValues] = useState<{ [key: string]: { value?: FilterValue; display?: string } }>({});

    // State to track selected field within a group

    const [groupSelections, setGroupSelections] = useState<{ [key: string]: string }>({});



    const [activePopup, setActivePopup] = useState<PopupFilter | null>(null);



    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('md'));



    useEffect(() => {

        setPageSize(isMobile ? 5 : 10);

        setCurrentPage(1);

    }, [isMobile]);



    // --- Data Fetching ---



    const fetchStructure = useCallback(async () => {

        setIsLoading(true);

        setError(null);

        try {

            const storedUser = sessionStorage.getItem('user');

            const user = storedUser ? JSON.parse(storedUser) : {};

            const usiteNo = user?.M_USITE_NO || 1;

            const response = await axios.get('/api/data/execute', {

                params: { serviceName: 'M_STRUCTURE', methodName: 'MVIEW', structureName, usiteNo }

            });

            if (response.data?.structureCont) {

                const parsedConfig = JSON.parse(response.data.structureCont);

                if (!parsedConfig.colgroup || parsedConfig.colgroup.length === 0) {
                    parsedConfig.colgroup = [
                        { "index": "Col1", "Width": "100%" },
                        { "index": "Col2", "Width": "100%" },
                        { "index": "Col3", "Width": "100%" }
                    ];
                }
        
                if (parsedConfig.filterView && parsedConfig.filterView.length > 0 && !parsedConfig.filterView[0].TD) {
                    const numCols = parsedConfig.colgroup.length;
                    const newFilterView = [];
                    for (let i = 0; i < parsedConfig.filterView.length; i += numCols) {
                        const chunk = parsedConfig.filterView.slice(i, i + numCols);
                        newFilterView.push({ TD: chunk });
                    }
                    parsedConfig.filterView = newFilterView;
                }

                setStructureConfig(parsedConfig);

            } else {

                throw new Error("화면 구성 정보를 찾을 수 없습니다.");

            }

        } catch (err) {

            setError(`화면 구성(${structureName})을 불러오는 데 실패했습니다.`);

            console.error('Structure fetch error:', err);

            setIsLoading(false);

        }

    }, [structureName]);



    const fetchData = useCallback(async (page: number) => {

        if (!structureConfig) return;

        setIsLoading(true);

        setError(null);

        try {

            const storedUser = sessionStorage.getItem('user');

            const user = storedUser ? JSON.parse(storedUser) : {};

            const usite = user?.M_USITE_NO || 1;

            const uid = user?.M_USER_NO || null;



            const appliedFilters: { [key: string]: FilterValue } = { ...searchFilters };



            Object.entries(dateFilterValues).forEach(([field, dates]) => {

                if (dates.from) appliedFilters[`${field}_FROM`] = dates.from;

                if (dates.to) appliedFilters[`${field}_TO`] = dates.to;

            });

            Object.entries(popupFilterValues).forEach(([field, popupValue]) => {

                if (popupValue.value) appliedFilters[field] = popupValue.value;

            });



            const response = await axios.get('/api/data/execute', {

                params: {

                    serviceName: structureConfig.service,

                    methodName: structureConfig.method,

                    USITE: usite,

                    UID: uid,

                    _page: page,

                    _sort: structureConfig.order,

                    _size: pageSize,

                    ...appliedFilters,

                }

            });

            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;

            setGridData(responseData?.data || []);

            setTotalCount(responseData?.totalCount || 0);

        } catch (err) {

            setError('데이터를 불러오는 데 실패했습니다.');

            console.error('Data fetch error:', err);

        } finally {

            setIsLoading(false);

        }

    }, [structureConfig, searchFilters, dateFilterValues, popupFilterValues, pageSize]);



    useEffect(() => { fetchStructure(); }, [fetchStructure]);



    useEffect(() => {

        if (structureConfig) {

            fetchData(currentPage);

        }

    }, [structureConfig, currentPage, fetchData]);

    

    // --- Filter Pre-processing ---



    const { processedFilters, initialGroupSelections } = useMemo(() => {

        const result: {

            processedFilters: ProcessedRow[];

            initialGroupSelections: { [key: string]: string };

        } = {

            processedFilters: [],

            initialGroupSelections: {},

        };



        if (!structureConfig?.filterView) return result;



        result.processedFilters = (structureConfig.filterView as FilterRow[]).map((row, rowIndex) => {

            if (!row || !('TD' in row)) return null;



            const units: RenderableUnit[] = [];

            const groups = new Map<string, TextFilterItem[]>();

            

            row.TD.forEach(item => {

                if (item.type === 'text' && item.groupName) {

                    if (!groups.has(item.groupName)) {

                        groups.set(item.groupName, []);

                    }

                    groups.get(item.groupName)!.push(item as TextFilterItem);

                }

            });



            groups.forEach((items, groupName) => {

                if (items.length > 0) {

                    result.initialGroupSelections[groupName] = items[0].field;

                }

            });

            

            const processedGroupNames = new Set<string>();



            row.TD.forEach((item, itemIndex) => {

                if (item.type === 'text' && item.groupName) {

                    if (!processedGroupNames.has(item.groupName)) {

                        processedGroupNames.add(item.groupName);

                        units.push({

                            type: 'group',

                            groupName: item.groupName,

                            items: groups.get(item.groupName)!,

                            key: item.groupName,

                        });

                    }

                } else {

                    units.push({

                        type: 'single',

                        item: item,

                        key: item.field || `single-${itemIndex}`,

                    });

                }

            });



            return { key: `row-${rowIndex}`, units };

        }).filter((r): r is ProcessedRow => r !== null);

        

        return result;

    }, [structureConfig]);



    useEffect(() => {

        setGroupSelections(initialGroupSelections);

    }, [initialGroupSelections]);



    // --- Event Handlers ---



    const handleSearch = () => {

        setCurrentPage(1);

        fetchData(1);

    };



    const handleDateFilterChange = (field: string, value: string, subField: 'from' | 'to') => {

        setDateFilterValues(prev => ({ ...prev, [field]: { ...prev[field], [subField]: value } }));

    };

    

    const handleUngroupedFilterChange = (field: string, value: string) => {

        setSearchFilters(prev => ({...prev, [field]: value}));

    };

    

    const handleGroupedSelectChange = (groupName: string, newSelectedField: string) => {

        const oldSelectedField = groupSelections[groupName];

        const currentValue = searchFilters[oldSelectedField] || '';



        setGroupSelections(prev => ({ ...prev, [groupName]: newSelectedField }));



        if (currentValue) {

            setSearchFilters(prev => {

                const newFilters = { ...prev };

                delete newFilters[oldSelectedField];

                newFilters[newSelectedField] = currentValue;

                return newFilters;

            });

        }

    };



    const handleGroupedValueChange = (groupName: string, newValue: string) => {

        const selectedField = groupSelections[groupName];

        if (!selectedField) return;



        setSearchFilters(prev => {

            const newFilters = { ...prev };



            let groupItems: TextFilterItem[] = [];

            for (const row of processedFilters) {

                const groupUnit = row.units.find(unit => unit.type === 'group' && unit.groupName === groupName) as { type: 'group'; items: TextFilterItem[] } | undefined;

                if (groupUnit) {

                    groupItems = groupUnit.items;

                    break;

                }

            }



            // Clear all fields in this group

            for (const item of groupItems) {

                delete newFilters[item.field];

            }

            // Set the value for the currently selected field

            if (newValue) {

                newFilters[selectedField] = newValue;

            }

            return newFilters;

        });

    };



    const handleOpenPopup = (filter: PopupFilter) => setActivePopup(filter);

    const handleClosePopup = () => setActivePopup(null);



    const handlePopupSelect = (selectedRow: GridRow) => {

        if (!activePopup) return;

        const { field, popupKey, displayField } = activePopup;

        setPopupFilterValues(prev => ({

            ...prev,

            [field]: { value: selectedRow[popupKey], display: selectedRow[displayField] as string }

        }));

    };

    // --- Render Methods ---

    if (isLoading && !activePopup) {
        return <Widget title={structureConfig?.title || "데이터 목록"}><CircularProgress /></Widget>;
    }
    if (error) {
        return <Widget title="오류"><Alert severity="error">{error}</Alert></Widget>;
    }
    if (!structureConfig) {
        return <Widget title="오류"><Alert severity="warning">화면 구성 정보를 찾을 수 없습니다.</Alert></Widget>;
    }

    const renderFilterControl = (filter: FilterItem) => {
        const filterType = filter.type || 'text';
        switch (filterType) {
            case 'dateBetween':
                return (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField label={`${filter.label}_FROM`} type="date" variant="outlined" value={dateFilterValues[filter.field]?.from || ''} onChange={e => handleDateFilterChange(filter.field, e.target.value, 'from')} InputLabelProps={{ shrink: true }} fullWidth />
                        <Typography sx={{ mx: 1 }}>~</Typography>
                        <TextField label={`${filter.label}_TO`} type="date" variant="outlined" value={dateFilterValues[filter.field]?.to || ''} onChange={e => handleDateFilterChange(filter.field, e.target.value, 'to')} InputLabelProps={{ shrink: true }} fullWidth />
                    </Stack>
                );
            case 'popup': {
                const popupFilter = filter as PopupFilter;
                return <PopupFilterInput filter={popupFilter} displayValue={popupFilterValues[popupFilter.field]?.display} onOpenPopup={() => handleOpenPopup(popupFilter)} onClear={() => setPopupFilterValues(p => ({ ...p, [popupFilter.field]: {} }))} />;
            }
            case 'date':
            case 'text':
            default: // Handles ungrouped text filters
                return (
                    <TextField label={filter.label} variant="outlined" type={filterType === 'date' ? 'date' : 'search'} value={searchFilters[filter.field] || ''} onChange={e => handleUngroupedFilterChange(filter.field, e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} InputLabelProps={{ shrink: filterType === 'date' || !!searchFilters[filter.field] }} fullWidth />
                );
        }
    };

        const renderFilters = () => {
            if (isMobile) { // Mobile layout
                return (
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Grid container gap={2}>
                            {processedFilters.map(row => (
                                // Each row will be a Grid item filling full width
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
                                                                <Select value={selectedField} label="검색항목" onChange={e => handleGroupedSelectChange(groupName, e.target.value)}>
                                                                    {items.map(item => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                                                                </Select>
                                                            </FormControl>
                                                            <TextField fullWidth label="검색어" variant="outlined" value={value} onChange={e => handleGroupedValueChange(groupName, e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
                                                        </Stack>
                                                    </Grid>
                                                );
                                            } else { // single
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
                                <Button variant="contained" onClick={handleSearch} fullWidth>조회</Button>
                            </Grid>
                        </Grid>
                    </Paper>
                );
            }
    
            const totalColumns = structureConfig?.colgroup?.length || 3;

            return (
                <Paper sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Stack spacing={0.5}>
                            {processedFilters.map(row => (
                                <Grid container spacing={1} key={row.key} alignItems="flex-start" sx={{ width: '100%', boxSizing: 'border-box' }}>
                                    {row.units.map(unit => {
                                        if (unit.type === 'group') {
                                            const { groupName, items } = unit;
                                            const selectedField = groupSelections[groupName] || items[0]?.field;
                                            const selectedItem = items.find(item => item.field === selectedField);
                                            
                                            const colspan = selectedItem?.colspan ? Number(selectedItem.colspan) : 1;
                                            const mdSize = Math.round((colspan / totalColumns) * 12);
                                            
                                            const value = searchFilters[selectedField] || '';
                                    
                                            return (
                                                <Grid item xs={12} md={mdSize} key={unit.key}>
                                                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                                                        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                            <InputLabel>검색항목</InputLabel>
                                                            <Select value={selectedField} label="검색항목" onChange={e => handleGroupedSelectChange(groupName, e.target.value)}>
                                                                {items.map(item => <MenuItem key={item.field} value={item.field}>{item.label}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                        <TextField fullWidth label="검색어" variant="outlined" value={value} onChange={e => handleGroupedValueChange(groupName, e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
                                                    </Stack>
                                                </Grid>
                                            );
                                        } else { // single
                                            const colspan = unit.item.colspan ? Number(unit.item.colspan) : 1;
                                            const mdSize = Math.round((colspan / totalColumns) * 12);

                                            return (
                                                <Grid item xs={12} md={mdSize} key={unit.key}>
                                                    {renderFilterControl(unit.item)}
                                                </Grid>
                                            );
                                        }
                                    })}
                                </Grid>
                            ))}
                                                            <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%', boxSizing: 'border-box' }}>                                <Grid item>
                                    <Button variant="contained" onClick={handleSearch} sx={{ padding: '16px 32px', width: { xs: '100%', md: 'auto' } }}>조회</Button>
                                </Grid>
                            </Grid>
                        </Stack>
                    </Box>
                </Paper>
            );
        };

    const renderDesktopView = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableRow>
                        {structureConfig.colModel.map((col, i) => <TableCell key={i} align={col.labelAlign || 'center'} sx={{ fontWeight: 'bold' }}>{col.label}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {gridData.map((row, i) => (
                        <TableRow key={row[structureConfig.keyName]?.toString() ?? i} hover={!!onRowClick} onClick={() => onRowClick?.(row)} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                            {structureConfig.colModel.map(col => {
                                const val = row[col.field];
                                const colType = col.type || 'text';
                                const displayVal = colType === 'date' && val ? new Date(val as string).toISOString().slice(0, 10) : val;
                                return <TableCell key={col.field} align={col.align || 'left'}>{displayVal?.toString()}</TableCell>
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderMobileView = () => (
        <Stack spacing={2}>
            {gridData.map((row, i) => (
                <Card key={row[structureConfig.keyName]?.toString() ?? i} onClick={() => onRowClick?.(row)} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                    <CardContent>
                        {structureConfig.colModel.map(col => (
                            <Box key={col.field} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{col.label}</Typography>
                                <Typography variant="body1">
                                    {(col.type || 'text') === 'date' && row[col.field] ? new Date(row[col.field] as string).toISOString().slice(0, 10) : row[col.field]?.toString()}
                                </Typography>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </Stack>
    );

    return (
        <>
            <Widget title={structureConfig.title}>
                {renderFilters()}
                {gridData.length > 0 ? (
                    <>
                        {isMobile ? renderMobileView() : renderDesktopView()}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <MuiPagination count={Math.ceil(totalCount / pageSize)} page={currentPage} onChange={(_, page) => setCurrentPage(page)} color="primary" />
                        </Box>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>총 {totalCount}건</Typography>
                    </>
                ) : (
                    <Paper sx={{ textAlign: 'center', p: 4 }}><Typography>표시할 데이터가 없습니다.</Typography></Paper>
                )}
            </Widget>
            {activePopup && <PopupGrid structureName={activePopup.structureName} title={`${activePopup.label} 선택`} onSelect={handlePopupSelect} onClose={handleClosePopup} />}
        </>
    );
};

export default DynamicGridWidget;