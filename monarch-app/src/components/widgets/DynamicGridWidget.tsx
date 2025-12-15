import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

// --- Local Components ---
import Widget from "../Widget";
import PopupFilterInput from './PopupFilterInput';
import type { PopupFilter } from './PopupFilterInput';
import PopupGrid from "./PopupGrid";
import FilterButtons from "./FilterButtons";

// --- MUI Material & Icons ---
import {
    useTheme, useMediaQuery, Box, Stack, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Card, CardContent, Typography, Pagination as MuiPagination, CircularProgress, Alert,
    Select, MenuItem, FormControl, InputLabel,
    Collapse, CardHeader, IconButton, Skeleton, Chip, Drawer, Fab, Zoom, Button
} from '@mui/material';
import { Grid } from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import SearchIcon from '@mui/icons-material/Search';

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Configuration for a single column in the grid.
 * @property label - Display name of the column header.
 * @property field - Data key corresponding to the row object.
 * @property type - Data type (text, date, number).
 * @property align - Text alignment for data cells.
 * @property labelAlign - Text alignment for header cells.
 * @property mobileImp - If 'true', this column is shown in the mobile card preview.
 * @property chip - If true, renders the value as a colored Chip badge.
 */
interface ColModel {
    label: string;
    field: string;
    type?: 'text' | 'date' | 'number';
    align?: 'left' | 'center' | 'right';
    labelAlign?: 'left' | 'center' | 'right';
    mobileImp?: string | boolean;
    chip?: boolean;
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

/**
 * Button configuration object.
 * @property label - Text to display on the button.
 * @property index - Unique identifier for the button.
 * @property inComm - Command identifier (e.g., 'List', 'initialize').
 * @property mobileAllow - "true" to show on mobile (except Search/Reset which are default).
 */
export interface ButtonConfig {
    label: string;
    index: string;
    inComm: string;
    mobileAllow?: string | boolean;
}

/**
 * Main configuration structure for the Dynamic Grid.
 * Typically parsed from a definition string/object.
 */
interface StructureConfig {
    title: string;
    colgroup?: ColGroup[];
    filterView: (FilterItem | FilterRow)[];
    colModel: ColModel[];
    service: string;
    method: string;
    keyName: string;
    order: string;
    buttons?: ButtonConfig[];
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


interface ProcessedRow {
    key: string;
    units: RenderableUnit[];
}


/**
 * Safely parses the configuration string/object.
 * Uses `new Function` to handle relaxed JSON formats often used in legacy systems.
 */
const parseConfig = (raw: unknown): StructureConfig => {
    if (typeof raw === 'object' && raw !== null) return raw as StructureConfig;
    try {
        // parsing using new Function to allow comments and trailing commas
        return new Function('return ' + String(raw))() as StructureConfig;
    } catch (e) {
        console.error("Config parse failed:", e);
        console.log("Raw Config:", raw);
        return {} as StructureConfig;
    }
};


/**
 * Renders a cell value based on column configuration.
 * - Dates: Formatted to YYYY-MM-DD.
 * - Chips: Renders a colored MUI Chip.
 * - Default: String representation.
 */
const renderValue = (col: ColModel, row: GridRow) => {
    const val = row[col.field];
    let displayVal = val?.toString();

    if ((col.type || 'text') === 'date' && val) {
        displayVal = new Date(val as string).toISOString().slice(0, 10);
    }

    if (col.chip && val) {
        // Simple deterministic color generation based on string hash
        const colors: ("default" | "primary" | "secondary" | "error" | "info" | "success" | "warning")[] =
            ["primary", "secondary", "success", "info", "warning", "error"];
        const hash = String(val).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[hash % colors.length];

        return <Chip label={displayVal} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    }

    return displayVal;
};


interface MobileGridCardProps {
    row: GridRow;
    structureConfig: StructureConfig;
    onRowClick?: (row: GridRow) => void;
}


/**
 * Card Component for Mobile View.
 * 
 * Features:
 * - Expandable details.
 * - Header with primary column.
 * - Preview of 'important' columns (`mobileImp`).
 * - Toggleable collapse section for remaining columns.
 */
const MobileGridCard: React.FC<MobileGridCardProps> = ({ row, structureConfig, onRowClick }) => {
    const [expanded, setExpanded] = useState(false);

    // Get columns
    const columns = structureConfig.colModel;
    if (columns.length === 0) return null;

    // First column as Header Title
    const titleCol = columns[0];
    const titleVal = row[titleCol.field]?.toString() || '-';

    // Remaining columns to consider for body
    const otherCols = columns.slice(1);

    // Check if any column has mobileImp set to true
    const hasImportant = otherCols.some(col => String(col.mobileImp) === 'true');

    let previewCols: ColModel[];
    let detailCols: ColModel[];

    if (hasImportant) {
        // If mobileImp is used, split based on it
        previewCols = otherCols.filter(col => String(col.mobileImp) === 'true');
        detailCols = otherCols.filter(col => String(col.mobileImp) !== 'true');
    } else {
        // If no mobileImp is found, show ALL remaining columns in preview
        previewCols = otherCols;
        detailCols = [];
    }

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const handleCardClick = () => {
        if (detailCols.length > 0) {
            setExpanded(!expanded);
        } else {
            onRowClick?.(row);
        }
    };

    return (
        <Card
            elevation={3}
            sx={{
                mb: 2,
                borderRadius: 3,
                overflow: 'visible',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:active': { transform: 'scale(0.98)' },
                cursor: 'pointer' // Always show pointer
            }}
            onClick={handleCardClick}
        >
            <CardHeader
                title={
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', color: 'primary.main' }}>
                        {titleVal}
                    </Typography>
                }
                subheader={
                    <Typography variant="caption" color="text.secondary">
                        {titleCol.label}
                    </Typography>
                }
                action={
                    detailCols.length > 0 && (
                        <IconButton
                            onClick={handleExpandClick}
                            aria-expanded={expanded}
                            aria-label="show more"
                            sx={{
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s'
                            }}
                        >
                            <ExpandMoreIcon color="action" />
                        </IconButton>
                    )
                }
                sx={{ pb: 1 }}
            />
            <CardContent sx={{ py: 1, '&:last-child': { pb: 2 } }}>
                <Stack spacing={1.5}>
                    {previewCols.map(col => (
                        <Box key={col.field} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                {col.label}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ textAlign: 'right' }}>
                                {renderValue(col, row)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </CardContent>
            {detailCols.length > 0 && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <CardContent sx={{ pt: 2, borderTop: '1px dashed #e0e0e0', bgcolor: 'rgba(0,0,0,0.01)' }}>
                        <Stack spacing={1.5}>
                            {detailCols.map(col => (
                                <Box key={col.field} sx={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                                        {col.label}
                                    </Typography>
                                    <Typography variant="body2">
                                        {renderValue(col, row)}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Collapse>
            )}
        </Card>
    );
};


/**
 * DynamicGridWidget Component
 * 
 * A generalized Data Grid widget capable of:
 * 1. Fetching configuration dynamicallly (structureConfig).
 * 2. Generating search filters (Single inputs, Grouped selects, Date ranges, Popups).
 * 3. Fetching and displaying data in a paginated table or mobile card list.
 * 4. Handling Excel downloads.
 * 5. Providing responsive UX (Drawer filters on mobile, Expandable cards).
 */
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

    // Mobile specific states
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [showTopBtn, setShowTopBtn] = useState(false);

    // Scroll listener for FAB
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setShowTopBtn(true);
            } else {
                setShowTopBtn(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

            /**
             * Expected API Response Structure (structureCont):
             * {
             *   title: "User List",
             *   colModel: [
             *     { field: "user_nm", label: "Name", align: "center", mobileImp: "true" },
             *     { field: "status", label: "Status", chip: true }
             *   ],
             *   filterView: [
             *     { TD: [ { label: "Search", field: "keyword", type: "text" } ] }
             *   ]
             * }
             */
            if (response.data?.structureCont) {
                const parsedConfig = parseConfig(response.data.structureCont);

                if (!parsedConfig.colgroup || parsedConfig.colgroup.length === 0) {
                    parsedConfig.colgroup = [
                        { "index": "Col1", "Width": "100%" },
                        { "index": "Col2", "Width": "100%" },
                        { "index": "Col3", "Width": "100%" }
                    ];
                }

                if (parsedConfig.filterView && parsedConfig.filterView.length > 0) {
                    const firstItem = parsedConfig.filterView[0];
                    if (!('TD' in firstItem)) {
                        const numCols = parsedConfig.colgroup?.length || 3;
                        const newFilterView: FilterRow[] = [];
                        // We know these are FilterItems because of the check above, but for TS safety we cast or trust the mixed array context
                        const flatItems = parsedConfig.filterView as FilterItem[];

                        for (let i = 0; i < flatItems.length; i += numCols) {
                            const chunk = flatItems.slice(i, i + numCols);
                            newFilterView.push({ TD: chunk });
                        }
                        parsedConfig.filterView = newFilterView;
                    }
                }

                if (!parsedConfig.buttons || parsedConfig.buttons.length === 0) {
                    parsedConfig.buttons = [
                        { "label": "조회", "index": "List", "inComm": "List" },
                        { "label": "초기화", "index": "Init", "inComm": "initialize" }
                    ];
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

            /**
             * State Unification for API Request:
             * 
             * We maintain 3 separate state objects for different filter types:
             * 1. searchFilters: Standard text/select inputs.
             * 2. dateFilterValues: Date range start/end values.
             * 3. popupFilterValues: Values selected from popup modals.
             * 
             * These are merged into `appliedFilters` below to form the final query parameters.
             */
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
        /**
         * Filter Grouping Logic:
         * 
         * The backend defines filters in a potentially flat or row-based structure.
         * We group filters that share the same `groupName` (e.g., "Category", "SubCategory")
         * so they can be rendered together in a single UI block or Select dropdown.
         * 
         * - Single Filters: Rendered as standard inputs.
         * - Grouped Filters: Rendered as a Select (to choose field) + Input (to enter value).
         */
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

    const handleReset = () => {
        setSearchFilters({});
        setDateFilterValues({});
        setPopupFilterValues({});
        setGroupSelections(initialGroupSelections);
    };

    const handleDateFilterChange = (field: string, value: string, subField: 'from' | 'to') => {
        setDateFilterValues(prev => ({ ...prev, [field]: { ...prev[field], [subField]: value } }));
    };

    const handleUngroupedFilterChange = (field: string, value: string) => {
        setSearchFilters(prev => ({ ...prev, [field]: value }));
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

    const handleExcelDownload = () => {
        if (!gridData || gridData.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }

        const headers = structureConfig?.colModel.map(col => col.label).join(',') || '';
        const fields = structureConfig?.colModel.map(col => col.field) || [];

        const csvRows = gridData.map(row => {
            return fields.map(field => {
                const val = row[field];
                const colDef = structureConfig?.colModel.find(c => c.field === field);
                const colType = colDef?.type || 'text';

                let processedVal = val;
                if (colType === 'date' && val) {
                    processedVal = new Date(val as string).toISOString().slice(0, 10);
                }

                // Escape quotas and wrap in quotes if necessary
                const stringVal = processedVal?.toString() || '';
                const escapedVal = stringVal.replace(/"/g, '""');
                return `"${escapedVal}"`;
            }).join(',');
        });

        const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n'); // Add BOM for Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${structureConfig?.title || 'download'}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleButtonClick = (btn: ButtonConfig) => {
        console.log('Button Clicked:', btn);
        if (btn.index === 'excelDown') {
            if (window.confirm("엑셀 파일을 다운로드 하시겠습니까?")) {
                handleExcelDownload();
            }
        }
        // Custom logic for other buttons can be added here
        // e.g., if (btn.index === 'MyCustomAction') { ... }
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
                            <FilterButtons onSearch={handleSearch} onReset={handleReset} onButtonClick={handleButtonClick} isMobile={isMobile} buttons={structureConfig?.buttons} />
                        </Grid>
                    </Grid>
                </Paper>
            );
        }

        // Desktop layout
        const totalColumns = structureConfig?.colgroup?.length || 3;

        return (
            <Paper sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2}>
                    {/* Filters Section */}
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
                    {/* Buttons Section */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <FilterButtons onSearch={handleSearch} onReset={handleReset} onButtonClick={handleButtonClick} isMobile={isMobile} buttons={structureConfig?.buttons} />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    const renderSkeleton = () => (
        <Stack spacing={2} sx={{ p: 1 }}>
            {[1, 2, 3, 4, 5].map((i) => (
                isMobile ? (
                    <Card key={i} sx={{ p: 2, borderRadius: 3 }} elevation={2}>
                        <Stack spacing={1}>
                            <Skeleton variant="text" width="60%" height={30} />
                            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                        </Stack>
                    </Card>
                ) : (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
                )
            ))}
        </Stack>
    );

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

                                let content: React.ReactNode = val?.toString();
                                if ((col.type || 'text') === 'date' && val) {
                                    content = new Date(val as string).toISOString().slice(0, 10);
                                }

                                if (col.chip && val) {
                                    const colors: ("default" | "primary" | "secondary" | "error" | "info" | "success" | "warning")[] =
                                        ["primary", "secondary", "success", "info", "warning", "error"];
                                    const hash = String(val).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                    const color = colors[hash % colors.length];
                                    content = <Chip label={content as string} color={color} size="small" variant="filled" />; // Desktop uses filled for better visibility
                                }

                                return <TableCell key={col.field} align={col.align || 'center'}>{content}</TableCell>
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderMobileView = () => (
        <Box sx={{ p: 1, pb: 8 }}>
            {/* Filter Floating Action Button (Top Right) */}
            <Fab
                color="primary"
                aria-label="search-conditions"
                onClick={() => setMobileFilterOpen(true)}
                sx={{
                    position: 'fixed',
                    top: 80, // Avoiding potential header overlap (adjust if needed)
                    right: 16,
                    zIndex: 1000
                }}
            >
                <SearchIcon />
            </Fab>

            {gridData.map((row, i) => (
                <MobileGridCard
                    key={row[structureConfig.keyName]?.toString() ?? i}
                    row={row}
                    structureConfig={structureConfig}
                    onRowClick={onRowClick}
                />
            ))}
        </Box>
    );

    return (
        <>
            <Widget title={structureConfig.title}>
                {/* Desktop Filters (Always visible on desktop) */}
                {!isMobile && renderFilters()}

                {gridData.length > 0 ? (
                    <>
                        {isMobile ? renderMobileView() : renderDesktopView()}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <MuiPagination count={Math.ceil(totalCount / pageSize)} page={currentPage} onChange={(_, page) => setCurrentPage(page)} color="primary" />
                        </Box>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'text.secondary' }}>총 {totalCount}건</Typography>
                    </>
                ) : (
                    isLoading ? renderSkeleton() : (
                        <Paper sx={{ textAlign: 'center', p: 4 }}><Typography>표시할 데이터가 없습니다.</Typography></Paper>
                    )
                )}
            </Widget>

            {/* Mobile Filter Drawer */}
            <Drawer
                anchor="bottom"
                open={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
                PaperProps={{
                    sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh' }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2 }} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>검색 조건</Typography>
                    {renderFilters()}
                    <Button fullWidth variant="contained" size="large" onClick={() => setMobileFilterOpen(false)} sx={{ mt: 2 }}>
                        닫기
                    </Button>
                </Box>
            </Drawer>

            {/* Scroll to Top FAB */}
            <Zoom in={showTopBtn}>
                <Fab
                    color="secondary"
                    onClick={scrollToTop}
                    sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
                    aria-label="scroll-to-top"
                >
                    <KeyboardArrowUpIcon />
                </Fab>
            </Zoom>

            {activePopup && <PopupGrid structureName={activePopup.structureName} title={`${activePopup.label} 선택`} onSelect={handlePopupSelect} onClose={handleClosePopup} />}
        </>
    );
};

export default DynamicGridWidget;