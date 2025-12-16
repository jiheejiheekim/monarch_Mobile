import React from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Skeleton, Stack, Card, useTheme, Chip
} from '@mui/material';
import type { StructureConfig, GridRow, ColModel } from './types';
import { MobileGridCard } from './MobileGridCard';
import { renderValue } from './utils';

interface GridTableProps {
    structureConfig: StructureConfig;
    gridData: GridRow[];
    isLoading: boolean;
    isMobile: boolean;
    onRowClick?: (row: GridRow) => void;
}

/**
 * 그리드 데이터 표시 컴포넌트
 * Desktop: 테이블 형태
 * Mobile: 카드 리스트 형태
 */
export const GridTable: React.FC<GridTableProps> = ({
    structureConfig,
    gridData,
    isLoading,
    isMobile,
    onRowClick
}) => {
    const theme = useTheme();

    // 로딩 상태 렌더링
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

    // Desktop 테이블 뷰
    const renderDesktopView = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
                    <TableRow>
                        {structureConfig.colModel.map((col, i) => (
                            <TableCell
                                key={i}
                                align={col.labelAlign || 'center'}
                                sx={{ fontWeight: 'bold' }}
                            >
                                {col.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {gridData.map((row, i) => (
                        <TableRow
                            key={row[structureConfig.keyName]?.toString() ?? i}
                            hover
                            onClick={() => onRowClick?.(row)}
                            sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {structureConfig.colModel.map(col => {
                                let content = renderValue(col, row);

                                // Desktop에서 chip을 filled variant로 표시
                                if (col.chip && row[col.field]) {
                                    const val = row[col.field];
                                    const displayVal = val?.toString();
                                    const colors: ("default" | "primary" | "secondary" | "error" | "info" | "success" | "warning")[] =
                                        ["primary", "secondary", "success", "info", "warning", "error"];
                                    const hash = String(val).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                    const color = colors[hash % colors.length];
                                    content = <Chip label={displayVal} color={color} size="small" variant="filled" />;
                                }

                                return (
                                    <TableCell key={col.field} align={col.align || 'center'}>
                                        {content}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // Mobile 카드 리스트 뷰
    const renderMobileView = () => (
        <Box sx={{ p: 1, pb: 8 }}>
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

    // 메인 렌더링
    if (isLoading) {
        return renderSkeleton();
    }

    if (gridData.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                데이터가 없습니다.
            </Box>
        );
    }

    return isMobile ? renderMobileView() : renderDesktopView();
};
