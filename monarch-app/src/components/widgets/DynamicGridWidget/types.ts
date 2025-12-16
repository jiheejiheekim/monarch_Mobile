import type { PopupFilter } from '../PopupFilterInput';

// ============================================================================
// 타입 정의 & 인터페이스
// ============================================================================

/**
 * 그리드 컬럼 설정
 * @property label - 컬럼 헤더 표시명
 * @property field - 데이터 필드명
 * @property type - 데이터 타입 (text, date, number)
 * @property align - 데이터 셀 정렬
 * @property labelAlign - 헤더 셀 정렬
 * @property mobileImp - 'true'인 경우 모바일 카드에 표시
 * @property chip - true인 경우 Chip 형태로 렌더링
 */
export interface ColModel {
    label: string;
    field: string;
    type?: 'text' | 'date' | 'number';
    align?: 'left' | 'center' | 'right';
    labelAlign?: 'left' | 'center' | 'right';
    mobileImp?: string | boolean;
    chip?: boolean;
}

export type BaseFilterItem = {
    label: string;
    field: string;
    type?: 'text' | 'select' | 'date' | 'dateBetween';
    groupName?: string;
    colspan?: number | string;
};

export type FilterItem = BaseFilterItem | PopupFilter;

export type TextFilterItem = BaseFilterItem & { type: 'text' };

export interface FilterRow {
    TD: FilterItem[];
}

export interface ColGroup {
    index: string;
    Width: string;
}

/**
 * 버튼 설정
 * @property label - 버튼 표시 텍스트
 * @property index - 버튼 고유 식별자
 * @property inComm - 명령 식별자 (예: 'List', 'initialize')
 * @property mobileAllow - 모바일에서 표시 여부 (검색/초기화는 기본 표시)
 */
export interface ButtonConfig {
    label: string;
    index: string;
    inComm: string;
    mobileAllow?: string | boolean;
}

/**
 * Dynamic Grid 메인 설정
 * 정의 문자열/객체에서 파싱됨
 */
export interface StructureConfig {
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

export interface GridRow {
    [key: string]: string | number | boolean | null | undefined;
}

export type FilterValue = string | number | boolean | null | undefined;

export interface DynamicGridWidgetProps {
    structureName: string;
    onRowClick?: (row: GridRow) => void;
}

// --- 필터 처리용 헬퍼 타입 ---

export type RenderableUnit =
    | { type: 'single'; item: FilterItem; key: string; }
    | { type: 'group'; groupName: string; items: TextFilterItem[]; key: string; };

export interface ProcessedRow {
    key: string;
    units: RenderableUnit[];
}

export interface MobileGridCardProps {
    row: GridRow;
    structureConfig: StructureConfig;
    onRowClick?: (row: GridRow) => void;
}
