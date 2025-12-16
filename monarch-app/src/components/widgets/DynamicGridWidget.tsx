import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    FilterItem,
    DynamicGridWidgetProps
} from './DynamicGridWidget/types';
import type { PopupFilter } from './PopupFilterInput';

// --- Common Components ---
import Widget from '../Widget';
import PopupGrid from './PopupGrid';

// --- MUI Material & Icons ---
import {
    useTheme, useMediaQuery, Box, Typography, CircularProgress, Alert,
    Drawer, Fab, Zoom, Button
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';

/**
 * DynamicGridWidget 컴포넌트
 * 
 * 범용 데이터 그리드 위젯:
 * 1. 동적으로 설정 가져오기 (structureConfig)
 * 2. 검색 필터 생성
 * 3. 페이지네이션된 테이블 또는 모바일 카드 목록으로 데이터 표시
 * 4. 엑셀 다운로드 처리
 * 5. 반응형 UX 제공
 */
const DynamicGridWidget: React.FC<DynamicGridWidgetProps> = ({ structureName, onRowClick }) => {

    // --- 상태 관리 ---
    const [structureConfig, setStructureConfig] = useState<StructureConfig | null>(null);
    const [gridData, setGridData] = useState<GridRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
    const [dateFilterValues, setDateFilterValues] = useState<Record<string, { from?: string, to?: string }>>({});
    const [popupFilterValues, setPopupFilterValues] = useState<Record<string, { value?: FilterValue; display?: string }>>({});
    const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});
    const [activePopup, setActivePopup] = useState<PopupFilter | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [showTopBtn, setShowTopBtn] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // --- 스크롤 및 화면 크기 변경 감지 ---
    useEffect(() => {
        const handleScroll = () => setShowTopBtn(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setPageSize(isMobile ? 5 : 10);
        setCurrentPage(1);
    }, [isMobile]);

    // --- 데이터 가져오기 ---
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
                const parsedConfig = parseConfig(response.data.structureCont);

                // Default values for robustness
                if (!parsedConfig.colgroup || parsedConfig.colgroup.length === 0) {
                    parsedConfig.colgroup = [{ "index": "Col1", "Width": "100%" }];
                }
                if (parsedConfig.filterView && parsedConfig.filterView.length > 0) {
                    const firstItem = parsedConfig.filterView[0];
                    if (!('TD' in firstItem)) {
                        parsedConfig.filterView = [{ TD: parsedConfig.filterView as FilterItem[] }];
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
        } finally {
            // Data fetching will be triggered by structureConfig change, so no need to stop loading here
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

            const appliedFilters: Record<string, FilterValue> = { ...searchFilters };
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

    // --- Debounced Search ---
    useEffect(() => {
        if (!structureConfig || isLoading) return;

        const hasFilters = Object.values(searchFilters).some(v => v) ||
            Object.values(dateFilterValues).some(v => v.from || v.to) ||
            Object.values(popupFilterValues).some(v => v.value);

        if (hasFilters) {
            const timeoutId = setTimeout(() => {
                if (currentPage !== 1) setCurrentPage(1);
                else fetchData(1);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [searchFilters, dateFilterValues, popupFilterValues, structureConfig, currentPage, fetchData, isLoading]);

    // --- 필터 전처리 ---
    const { processedFilters, initialGroupSelections } = useMemo((): {
        processedFilters: ProcessedRow[];
        initialGroupSelections: Record<string, string>;
    } => {
        if (!structureConfig?.filterView) return { processedFilters: [], initialGroupSelections: {} };

        const initialSelections: Record<string, string> = {};
        const processed = (structureConfig.filterView as IFilterRow[]).map((row, rowIndex) => {
            if (!row || !row.TD) return null;

            const units: ProcessedRow['units'] = [];
            const groups = new Map<string, TextFilterItem[]>();

            row.TD.forEach(item => {
                if (item.type === 'text' && item.groupName) {
                    if (!groups.has(item.groupName)) groups.set(item.groupName, []);
                    groups.get(item.groupName)!.push(item as TextFilterItem);
                }
            });

            groups.forEach((items, groupName) => {
                if (items.length > 0) initialSelections[groupName] = items[0].field;
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

        return { processedFilters: processed, initialGroupSelections: initialSelections };
    }, [structureConfig]);

    useEffect(() => {
        setGroupSelections(initialGroupSelections);
    }, [initialGroupSelections]);

    // --- 이벤트 핸들러 ---
    const handleSearch = () => {
        if (currentPage !== 1) setCurrentPage(1);
        else fetchData(1);
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

    const handleExcelDownload = () => {
        if (!gridData || gridData.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }
        const headers = structureConfig?.colModel.map(col => col.label).join(',') || '';
        const fields = structureConfig?.colModel.map(col => col.field) || [];
        const csvRows = gridData.map(row => {
            return fields.map(field => {
                const val = (row[field] ?? '').toString().replace(/"/g, '""');
                return `"${val}"`;
            }).join(',');
        });
        const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${structureConfig?.title || 'download'}.csv`);
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
    if (!structureConfig) {
        return (
            <Widget title={structureName}>
                {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
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
            totalColumns={structureConfig.colgroup?.length || 1}
            isMobile={isMobile}
            buttons={structureConfig.buttons}
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
            <Widget title={structureConfig.title}>
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

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <GridTable
                    structureConfig={structureConfig}
                    gridData={gridData}
                    isLoading={isLoading}
                    isMobile={isMobile}
                    onRowClick={onRowClick}
                />

                {!isLoading && gridData.length > 0 && (
                    <>
                        <GridPagination
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            isMobile={isMobile}
                        />
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'text.secondary' }}>
                            총 {totalCount}건
                        </Typography>
                    </>
                )}
            </Widget>

            {/* Mobile Filter Drawer */}
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

            {activePopup && <PopupGrid structureName={activePopup.structureName} title={`${activePopup.label} 선택`} onSelect={handlePopupSelect} onClose={() => setActivePopup(null)} />}
        </>
    );
};

export default DynamicGridWidget;