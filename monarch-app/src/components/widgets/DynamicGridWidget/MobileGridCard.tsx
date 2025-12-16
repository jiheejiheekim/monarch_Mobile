import React, { useState } from 'react';
import {
    Card, CardContent, CardHeader, Typography, Box, Stack,
    Collapse, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { MobileGridCardProps, ColModel } from './types';
import { renderValue } from './utils';

/**
 * 모바일 뷰 카드 컴포넌트
 * 
 * 기능:
 * - 확장 가능한 상세 정보
 * - 기본 컬럼을 헤더로 표시
 * - 'mobileImp'가 true인 컬럼들을 미리보기로 표시
 * - 나머지 컬럼들은 토글 가능한 collapse 영역에 표시
 */
export const MobileGridCard: React.FC<MobileGridCardProps> = ({ row, structureConfig, onRowClick }) => {
    const [expanded, setExpanded] = useState(false);

    // 컬럼 가져오기
    const columns = structureConfig.colModel;
    if (columns.length === 0) return null;

    // 첫 번째 컬럼을 헤더 타이틀로 사용
    const titleCol = columns[0];
    const titleVal = row[titleCol.field]?.toString() || '-';

    // 본문에 표시할 나머지 컬럼들
    const otherCols = columns.slice(1);

    // mobileImp가 true로 설정된 컬럼이 있는지 확인
    const hasImportant = otherCols.some(col => String(col.mobileImp) === 'true');

    let previewCols: ColModel[];
    let detailCols: ColModel[];

    if (hasImportant) {
        // mobileImp가 사용된 경우, 그것을 기준으로 분리
        previewCols = otherCols.filter(col => String(col.mobileImp) === 'true');
        detailCols = otherCols.filter(col => String(col.mobileImp) !== 'true');
    } else {
        // mobileImp가 없으면, 모든 나머지 컬럼을 미리보기에 표시
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
                cursor: 'pointer'
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
