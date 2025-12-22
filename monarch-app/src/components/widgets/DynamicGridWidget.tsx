import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import axios from 'axios';

// --- Child Components ---
import { GridFilters } from './DynamicGridWidget/GridFilters';
import { GridTable } from './DynamicGridWidget/GridTable';
import { GridPagination } from './DynamicGridWidget/GridPagination';
import { parseConfig } from './DynamicGridWidget/utils';
import type {
    StructureConfig,
    GridRow,
    FilterValue,
    ButtonConfig,
    ProcessedRow,
    TextFilterItem,
    FilterRow as IFilterRow,
    DynamicGridWidgetProps,
    FilterItem,
    RenderableUnit
} from './DynamicGridWidget/types';
import type { PopupFilter } from './PopupFilterInput';

// --- Common Components ---
import Widget from '../Widget';
// Lazy load PopupGrid to break circular dependency
const PopupGrid = lazy(() => import('./PopupGrid'));

// --- MUI Material & Icons ---
import {
    useTheme, useMediaQuery, Box, Typography, CircularProgress, Alert,
    Drawer, Fab, Zoom, Button
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';

/**
 * DynamicGridWidget 컴포넌트
 */
const DynamicGridWidget: React.FC<DynamicGridWidgetProps> = ({ structureName, onRowClick }) => {

    // --- 상태 관리 통합 ---
    const [state, setState] = useState<{
        config: StructureConfig | null;
        data: GridRow[];
        isLoading: boolean;
        error: string | null;
        totalCount: number;
    }>({
        config: null,
        data: [],
        isLoading: true,
        error: null,
        totalCount: 0
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
    const [dateFilterValues, setDateFilterValues] = useState<Record<string, { from?: string, to?: string }>>({});
    const [popupFilterValues, setPopupFilterValues] = useState<Record<string, { value?: FilterValue; display?: string }>>({});
    const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});
    const [activePopup, setActivePopup] = useState<PopupFilter | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [showTopBtn, setShowTopBtn] = useState(false);

    // Initialization and deduplication guards
    const lastStructureName = useRef<string | null>(null);
    const lastFetchSignature = useRef<string>("");
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // --- 스크롤 및 화면 크기 변경 감지 ---
    useEffect(() => {
        const handleScroll = () => setShowTopBtn(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!state.config) {
            setPageSize(isMobile ? 5 : 10);
            setCurrentPage(1);
        }
    }, [isMobile, state.config]);

    // --- 데이터 가져오기 ---
    const fetchData = useCallback(async (page: number, currentFilters: {
        search: Record<string, string>,
        date: Record<string, { from?: string, to?: string }>,
        popup: Record<string, { value?: FilterValue; display?: string }>
    }) => {
        if (!state.config) return;
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const storedUser = sessionStorage.getItem('user');
            let user: any = {};
            try { user = storedUser ? JSON.parse(storedUser) : {}; } catch (e) { /* ignore */ }
            const usite = user?.M_USITE_NO || 1;
            const uid = user?.M_USER_NO || null;

            const appliedFilters: Record<string, FilterValue> = {};
            Object.entries(currentFilters.search).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') appliedFilters[key] = val;
            });
            Object.entries(currentFilters.date).forEach(([field, dates]) => {
                if (dates.from) appliedFilters[`${field}_FROM`] = dates.from;
                if (dates.to) appliedFilters[`${field}_TO`] = dates.to;
            });
            Object.entries(currentFilters.popup).forEach(([field, popupValue]) => {
                if (popupValue.value !== undefined && popupValue.value !== null && popupValue.value !== '') appliedFilters[field] = popupValue.value;
            });

            const response = await axios.get('/api/data/execute', {
                params: {
                    serviceName: state.config.service,
                    methodName: state.config.method,
                    USITE: usite,
                    UID: uid,
                    _page: page,
                    _sort: state.config.order,
                    _size: pageSize,
                    ...appliedFilters,
                }
            });

            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
            setState(prev => ({
                ...prev,
                data: responseData?.data || [],
                totalCount: responseData?.totalCount || 0,
                isLoading: false
            }));
        } catch (err) {
            console.error('Data fetch error:', err);
            setState(prev => ({ ...prev, isLoading: false, error: '데이터를 불러오는 데 실패했습니다.' }));
        }
    }, [state.config, pageSize]);

    // --- 필터 전처리 ---
    const { processedFilters, initialGroupSelections } = useMemo((): {
        processedFilters: ProcessedRow[];
        initialGroupSelections: Record<string, string>;
    } => {
        if (!state.config?.filterView || !Array.isArray(state.config.filterView)) return { processedFilters: [], initialGroupSelections: {} };

        const initialSelections: Record<string, string> = {};
        const rawFilters = state.config.filterView;
        const processed = (rawFilters as any[]).map((rowOrItem, rowIndex) => {
            if (!rowOrItem) return null;

            const items: FilterItem[] = Array.isArray(rowOrItem.TD) ? rowOrItem.TD : [rowOrItem];
            const units: RenderableUnit[] = [];
            const groups = new Map<string, TextFilterItem[]>();

            items.forEach(item => {
                const type = item?.type?.toLowerCase();
                if (item && type === 'text' && item.groupName) {
                    if (!groups.has(item.groupName)) groups.set(item.groupName, []);
                    groups.get(item.groupName)!.push(item as TextFilterItem);
                }
            });

            groups.forEach((groupItems, groupName) => {
                if (groupItems.length > 0) initialSelections[groupName] = groupItems[0].field;
            });

            const processedGroupNames = new Set<string>();
            items.forEach((item, itemIndex) => {
                if (!item) return;
                const type = item.type?.toLowerCase();
                if (type === 'text' && item.groupName) {
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
                        item: { ...item, type: type as any },
                        key: item.field || `single-${itemIndex}`,
                    });
                }
            });
            return units.length > 0 ? { key: `row-${rowIndex}`, units } : null;
        }).filter((r): r is ProcessedRow => r !== null);

        return { processedFilters: processed, initialGroupSelections: initialSelections };
    }, [state.config]);

    // --- Consolidated Initialization & Data Fetching ---
    const filtersString = useMemo(() => JSON.stringify({ searchFilters, dateFilterValues, popupFilterValues }), [searchFilters, dateFilterValues, popupFilterValues]);

    useEffect(() => {
        let isEffectMounted = true;
        const abortController = new AbortController();

        const initializeComponent = async () => {
            if (!structureName) return;
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            try {
                // 1. Fetch Structure Config
                const storedUser = sessionStorage.getItem('user');
                let user: any = {};
                try { user = storedUser ? JSON.parse(storedUser) : {}; } catch (e) { /* ignore */ }
                const usiteNo = user?.M_USITE_NO || 1;

                const structResponse = await axios.get('/api/data/execute', {
                    params: { serviceName: 'M_STRUCTURE', methodName: 'MVIEW', structureName, usiteNo },
                    signal: abortController.signal
                });

                if (!isEffectMounted) return;

                const rawConfig = structResponse.data?.structureCont;
                if (!rawConfig) throw new Error("화면 구성 정보를 찾을 수 없습니다.");

                const parsedConfig = parseConfig(rawConfig);

                // 2. Fetch Initial Data
                const usite = user?.M_USITE_NO || 1;
                const uid = user?.M_USER_NO || null;

                const dataResponse = await axios.get('/api/data/execute', {
                    params: {
                        serviceName: parsedConfig.service,
                        methodName: parsedConfig.method,
                        USITE: usite,
                        UID: uid,
                        _page: 1,
                        _sort: parsedConfig.order,
                        _size: pageSize,
                    },
                    signal: abortController.signal
                });

                if (!isEffectMounted) return;

                const responseData = Array.isArray(dataResponse.data) ? dataResponse.data[0] : dataResponse.data;

                setState({
                    config: parsedConfig,
                    data: responseData?.data || [],
                    totalCount: responseData?.totalCount || 0,
                    error: null,
                    isLoading: false
                });

                setCurrentPage(1);
                lastStructureName.current = structureName;
                lastFetchSignature.current = `${structureName}|${filtersString}|1|${pageSize}`;

                // Force reset selections for the new structure
                // Logic already handled by processedFilters dependency in other hooks
            } catch (err: any) {
                if (err.name === 'CanceledError') return;
                console.error("Initialization failed:", err);
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: `화면 초기화 실패: ${err.message || "Unknown error"}`
                }));
            }
        };

        initializeComponent();
        return () => {
            isEffectMounted = false;
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [structureName]);

    useEffect(() => {
        if (!state.config || lastStructureName.current !== structureName) return;
        const sig = `${structureName}|${filtersString}|${currentPage}|${pageSize}`;
        if (lastFetchSignature.current === sig) return;

        const timeoutId = setTimeout(() => {
            if (!isMounted.current) return;
            const currentFilters = { search: searchFilters, date: dateFilterValues, popup: popupFilterValues };
            lastFetchSignature.current = sig;
            fetchData(currentPage, currentFilters);
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [state.config, filtersString, currentPage, pageSize, structureName, fetchData]);

    // --- 이벤트 핸들러 ---
    const handleSearch = () => {
        const currentFilters = { search: searchFilters, date: dateFilterValues, popup: popupFilterValues };
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchData(1, currentFilters);
        }
    };

    const handleReset = () => {
        setSearchFilters({});
        setDateFilterValues({});
        setPopupFilterValues({});
        setGroupSelections(initialGroupSelections);
        if (currentPage !== 1) setCurrentPage(1);
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
        setSearchFilters(prev => ({ ...prev, [selectedField]: newValue }));
    };

    const handlePopupSelect = (selectedRow: GridRow) => {
        if (!activePopup) return;
        const { field, popupKey, displayField } = activePopup;
        setPopupFilterValues(prev => ({
            ...prev,
            [field]: { value: selectedRow[popupKey], display: selectedRow[displayField] as string }
        }));
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleExcelDownload = () => {
        if (!state.data || state.data.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }
        const headers = state.config?.colModel.map(col => col.label).join(',') || '';
        const fields = state.config?.colModel.map(col => col.field) || [];
        const csvRows = state.data.map(row => {
            return fields.map(field => {
                const val = (row[field] ?? '').toString().replace(/"/g, '""');
                return `"${val}"`;
            }).join(',');
        });
        const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${state.config?.title || 'download'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleButtonClick = (btn: ButtonConfig) => {
        if (btn.inComm === 'List') handleSearch();
        else if (btn.inComm === 'initialize') handleReset();
        else if (btn.index === 'excelDown') {
            if (window.confirm("엑셀 파일을 다운로드 하시겠습니까?")) handleExcelDownload();
        }
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // --- 렌더링 ---
    if (!state.config) {
        return (
            <Widget title={structureName}>
                {state.error ? <Alert severity="error">{state.error}</Alert> : <CircularProgress />}
            </Widget>
        );
    }

    const filtersComponent = (
        <GridFilters
            processedFilters={processedFilters}
            searchFilters={searchFilters}
            dateFilterValues={dateFilterValues}
            popupFilterValues={popupFilterValues}
            groupSelections={groupSelections}
            totalColumns={Math.max(1, state.config.colgroup?.length || 1)}
            isMobile={isMobile}
            buttons={state.config.buttons}
            onUngroupedFilterChange={handleUngroupedFilterChange}
            onGroupedSelectChange={handleGroupedSelectChange}
            onGroupedValueChange={handleGroupedValueChange}
            onDateFilterChange={handleDateFilterChange}
            onPopupOpen={setActivePopup}
            onPopupClear={(field) => setPopupFilterValues(p => ({ ...p, [field]: {} }))}
            onSearch={handleSearch}
            onReset={handleReset}
            onButtonClick={handleButtonClick}
        />
    );

    return (
        <>
            <Widget title={state.config.title}>
                {isMobile ? (
                    <Fab
                        color="primary"
                        aria-label="search-conditions"
                        onClick={() => setMobileFilterOpen(true)}
                        sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1000 }}
                    >
                        <SearchIcon />
                    </Fab>
                ) : (
                    filtersComponent
                )}

                {state.error && <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert>}

                <GridTable
                    structureConfig={state.config}
                    gridData={state.data}
                    isLoading={state.isLoading}
                    isMobile={isMobile}
                    onRowClick={onRowClick}
                />

                {!state.isLoading && state.data.length > 0 && (
                    <GridPagination
                        currentPage={currentPage}
                        totalCount={state.totalCount}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={handlePageSizeChange}
                        isMobile={isMobile}
                    />
                )}
            </Widget>

            <Drawer
                anchor="bottom"
                open={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
                PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85vh' } }}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2 }} /></Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>검색 조건</Typography>
                    {filtersComponent}
                    <Button fullWidth variant="contained" size="large" onClick={() => setMobileFilterOpen(false)} sx={{ mt: 2 }}>
                        닫기
                    </Button>
                </Box>
            </Drawer>

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

            {activePopup && (
                <Suspense fallback={<CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000 }} />}>
                    <PopupGrid structureName={activePopup.structureName} title={`${activePopup.label} 선택`} onSelect={handlePopupSelect} onClose={() => setActivePopup(null)} />
                </Suspense>
            )}
        </>
    );
};

export default DynamicGridWidget;
