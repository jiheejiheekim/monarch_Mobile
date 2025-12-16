import React from 'react';
import { Box, Pagination as MuiPagination } from '@mui/material';

interface GridPaginationProps {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    isMobile: boolean;
}

/**
 * 그리드 페이징 컴포넌트
 * 페이지 네비게이션 UI 제공
 */
export const GridPagination: React.FC<GridPaginationProps> = ({
    currentPage,
    totalCount,
    pageSize,
    onPageChange,
    isMobile
}) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
            <MuiPagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                showFirstButton
                showLastButton
            />
        </Box>
    );
};
