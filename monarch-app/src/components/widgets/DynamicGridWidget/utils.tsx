import { Chip } from '@mui/material';
import type { ColModel, GridRow, StructureConfig } from './types';

/**
 * 설정 문자열/객체를 안전하게 파싱
 * 레거시 시스템에서 사용하는 유연한 JSON 형식을 처리하기 위해 new Function 사용
 */
export const parseConfig = (raw: unknown): StructureConfig => {
    if (typeof raw === 'object' && raw !== null) return raw as StructureConfig;
    try {
        // 콤메트와 후행 쉽표를 허용하기 위해 new Function으로 파싱
        return new Function('return ' + String(raw))() as StructureConfig;
    } catch (e) {
        console.error("Config parse failed:", e);
        console.log("Raw Config:", raw);
        return {} as StructureConfig;
    }
};

/**
 * 컬럼 설정에 따라 셀 값을 렌더링
 * - 날짜: YYYY-MM-DD 형식으로 변환
 * - Chip: 색상이 있는 MUI Chip으로 표시
 * - 기본: 문자열로 표시
 */
export const renderValue = (col: ColModel, row: GridRow) => {
    const val = row[col.field];
    let displayVal = val?.toString();

    if ((col.type || 'text') === 'date' && val) {
        displayVal = new Date(val as string).toISOString().slice(0, 10);
    }

    if (col.chip && val) {
        // 문자열 해시 기반으로 결정적인 색상 생성
        const colors: ("default" | "primary" | "secondary" | "error" | "info" | "success" | "warning")[] =
            ["primary", "secondary", "success", "info", "warning", "error"];
        const hash = String(val).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const color = colors[hash % colors.length];

        return <Chip label={displayVal} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    }

    return displayVal;
};
