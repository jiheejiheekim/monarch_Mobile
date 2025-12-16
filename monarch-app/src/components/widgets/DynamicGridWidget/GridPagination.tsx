import React from 'react';
import { Box, Pagination as MuiPagination, Stack, FormControl, Select, MenuItem, Typography } from '@mui/material';

interface GridPaginationProps {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isMobile: boolean;
}

/**
 * 그리드 페이징 컴포넌트
 * 페이지 네비게이션, 총 건수, 페이지 크기 선택 UI 제공
 */
export const GridPagination: React.FC<GridPaginationProps> = ({
    currentPage,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isMobile
}) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1 && totalCount <= pageSize) return null;

    const pageSizeOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
            sx={{ mt: 3, mb: 2, p: 1 }}
        >
            <Typography
                variant="body2"
                sx={{
                    color: 'text.secondary',
                    order: { xs: 2, md: 1 }
                }}
            >
                총 {totalCount}건
            </Typography>

            <Box
                sx={{
                    order: { xs: 1, md: 2 },
                    width: { xs: '100%', md: 'auto' },
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
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
            
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    order: { xs: 3, md: 3 },
                    marginLeft: { xs: 'auto', md: 0 }
                }}
            >
                <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    Rows per page:
                </Typography>
                <FormControl size="small" variant="outlined">
                    <Select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        labelId="page-size-select-label"
                    >
                        {pageSizeOptions.map(size => (
                            <MenuItem key={size} value={size}>
                                {size}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Stack>
    );
};
