import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// 필터의 전체 설정을 포함할 수 있도록 확장 가능한 인터페이스
export interface PopupFilter {
    label: string;
    field: string;
    displayField: string;
    type: 'popup';
    structureName: string;
    popupKey: string;
    colspan?: number | string;
    codeGroup?: string;
}

interface PopupFilterInputProps {
    filter: PopupFilter;
    displayValue: string | undefined; // 화면에 표시될 값 (e.g., USER_NAME)
    onOpenPopup: () => void;
    onClear: () => void;
}

const PopupFilterInput: React.FC<PopupFilterInputProps> = ({ filter, displayValue, onOpenPopup, onClear }) => {
    return (
        <TextField
            label={filter.label}
            variant="outlined"
            value={displayValue || ''}
            onClick={onOpenPopup}
            // Use inputProps to make it readOnly, so the virtual keyboard doesn't pop up on mobile
            inputProps={{
                readOnly: true,
            }}
            // Use sx prop for custom styling to ensure cursor changes to pointer
            sx={{
                cursor: 'pointer',
                '& .MuiInputBase-input': {
                    cursor: 'pointer', // Ensure the input area also has a pointer cursor
                },
            }}
            fullWidth
            InputLabelProps={{
                shrink: !!displayValue,
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        {displayValue && (
                            <IconButton
                                aria-label="clear selection"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent the TextField's onClick from firing
                                    onClear();
                                }}
                                edge="end"
                            >
                                <ClearIcon />
                            </IconButton>
                        )}
                        <IconButton
                            aria-label="open search popup"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent the TextField's onClick from firing
                                onOpenPopup();
                            }}
                            edge="end"
                        >
                            <SearchIcon />
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default PopupFilterInput;
