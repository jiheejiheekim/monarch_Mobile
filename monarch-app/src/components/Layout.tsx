// React와 핵심 훅(Hook)들을 가져옵니다.
// useState: 컴포넌트의 상태(기억해야 할 값)를 관리합니다.
// useEffect: 컴포넌트의 생명주기(마운트, 업데이트 등)에 맞춰 부수 효과(side effect)를 실행합니다.
// useMemo: 계산 비용이 큰 함수의 결과를 캐싱하여 성능을 최적화합니다.
import React, { useState, useEffect, useMemo } from 'react';

// React Router의 핵심 컴포넌트와 훅들을 가져옵니다.
// Link: 페이지를 새로고침하지 않고 다른 경로로 이동시키는 링크를 생성합니다.
// Outlet: 중첩된 라우트(Route)의 자식 컴포넌트가 렌더링될 위치를 지정합니다.
// useLocation: 현재 URL의 경로 정보를 가져옵니다. 페이지 이동을 감지할 때 유용합니다.
// useNavigate: 코드를 통해 프로그래밍 방식으로 페이지를 이동시킬 때 사용합니다. (예: 로그아웃 후 로그인 페이지로 이동)
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

// 서버와 HTTP 통신을 하기 위한 axios 라이브러리를 가져옵니다.
import axios from 'axios';

// 이 컴포넌트 전용 CSS 모듈을 가져옵니다. 클래스 이름 충돌을 방지합니다.
import styles from './Layout.module.css';

// --- 타입 정의 ---
// TypeScript를 사용하여 데이터의 형태를 명확하게 정의하면, 코드의 안정성과 가독성이 크게 향상됩니다.

// API로부터 받는 사용자 정보 객체의 타입을 정의합니다.
interface UserData {
    USER_NAME: string;
    M_USITE_NO: number;
    M_USER_NO: number;
    // 그 외 다양한 타입의 속성이 추가될 수 있음을 명시합니다.
    [key: string]: string | number | boolean | null | undefined;
}

// 하위 메뉴 아이템의 타입을 정의합니다. (아이콘이나 또 다른 하위 메뉴는 갖지 않습니다)
interface SubMenuItem {
    name: string;
    path?: string;
    structureName?: string;
}

// 최상위 메뉴 아이템의 타입을 정의합니다.
interface MenuItem {
    name: string;
    path?: string;         // 직접 이동할 경로 (예: /dashboard)
    structureName?: string; // 동적 그리드 페이지로 이동할 때 사용할 이름
    icon?: string;         // 사이드바에 표시될 이모지 아이콘
    subItems?: SubMenuItem[]; // 하위 메뉴 목록
}

// --- 메뉴 데이터 ---
// 애플리케이션의 전체 네비게이션 메뉴 구조를 하나의 배열로 관리합니다.
// 메뉴를 추가, 수정, 삭제할 때 이 부분만 변경하면 되므로 유지보수가 용이합니다.
const menuItems: MenuItem[] = [
    { name: '대시보드', path: '/', icon: '📊' },
    { name: '영업', icon: '💼', subItems: [
        { name: '영업관리', structureName: '영업관리_MTBL' },
        { name: '접촉관리', structureName: '접촉관리_MTBL' }
    ]},
    { name: '고객', icon: '👥', subItems: [
        { name: '고객관리', structureName: '고객관리_MTBL' }
    ] },
    { name: 'Admin', icon: '⚙️', subItems: [
        { name: '사용자관리', structureName: '사용자관리_MTBL' },
        { name: '개발정보', path: '/admin/dev' },
        { name: 'Structure정보', path: '/admin/structure' },
        { name: 'Service정보', path: '/admin/service' }
    ] },
    // 새로 추가된 대메뉴
    { name: 'MY Sales Plan', icon: '📝', subItems: [
        { name: '접촉영업건', structureName: '접촉영업건_MTBL' }
    ] }

];

/**
 * 메뉴 아이템 객체로부터 실제 링크(URL) 경로를 계산하는 헬퍼(도우미) 함수입니다.
 * 메뉴 아이템의 종류(일반 링크, 동적 그리드, 하위 메뉴를 가진 부모 메뉴)에 따라
 * 올바른 경로를 생성하는 로직을 중앙에서 관리합니다.
 */
const getMenuItemLinkPath = (item: MenuItem | SubMenuItem): string => {
    if (item.path) return item.path; // 1. path 속성이 있으면 그대로 반환
    if (item.structureName) return `/${item.structureName}`; // 2. structureName이 있으면 동적 그리드 경로 생성
    // 3. 부모 메뉴일 경우, 첫 번째 자식 메뉴의 경로를 대표 경로로 사용
    if ('subItems' in item && item.subItems && item.subItems.length > 0) {
        const firstSub = item.subItems[0];
        return firstSub.path || (firstSub.structureName ? `/${firstSub.structureName}` : '#');
    }
    return '#'; // 모든 조건에 해당하지 않으면 이동하지 않는 링크 반환
};

/**
 * @component Layout
 * @description 애플리케이션의 전체적인 뼈대(사이드바, 상단 바, 메인 콘텐츠 영역)를 구성하는 핵심 컴포넌트입니다.
 *              로그인 후 보여지는 모든 페이지는 이 Layout 컴포넌트 내부에 렌더링됩니다.
 */
const Layout: React.FC = () => {
    // --- 상태(State) 관리 ---
    const [isSidebarPinned, setSidebarPinned] = useState(false); // 사이드바 고정 여부 상태
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // 모바일 화면에서 사이드바 메뉴가 열렸는지 여부
    const [openMenu, setOpenMenu] = useState<string | null>(null); // 사이드바의 아코디언 메뉴 중 현재 열린 메뉴의 이름
    
    // --- React Router 훅 ---
    const location = useLocation(); // 현재 URL 경로 정보를 담고 있는 객체. 페이지 이동 감지에 사용됩니다.
    const navigate = useNavigate(); // 페이지를 프로그래밍 방식으로 이동시키는 함수

    // --- 데이터 관리 ---
    // sessionStorage에서 사용자 정보를 읽어옵니다.
    // useMemo를 사용하여, 컴포넌트가 불필요하게 리렌더링될 때마다 sessionStorage를 반복적으로 읽는 것을 방지하고 성능을 최적화합니다.
    const user: UserData | null = useMemo(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    }, []);

    // --- 동적 클래스 이름 관리 ---
    // 상태 값에 따라 CSS 클래스 이름을 동적으로 조합합니다. 이를 통해 조건부 스타일링을 구현합니다.
    const sidebarClasses = `${styles.sidebar} ${isSidebarPinned ? styles.pinned : ''}`;
    const mainContentClasses = `${styles.mainContent} ${isSidebarPinned ? styles.shifted : ''}`;
    const mobileSidebarClasses = `${sidebarClasses} ${isMobileMenuOpen ? styles.mobileOpen : ''}`;

    // --- 이벤트 핸들러 ---
    // 사이드바 메뉴 클릭 시 호출되어 아코디언 메뉴를 제어합니다.
    const handleMenuClick = (e: React.MouseEvent, itemName: string, hasSubItems: boolean) => {
        if (hasSubItems) {
            e.preventDefault(); // 하위 메뉴가 있는 경우, 링크로 바로 이동하는 것을 막습니다.
            setOpenMenu(openMenu === itemName ? null : itemName); // 클릭한 메뉴가 이미 열려있으면 닫고, 아니면 엽니다.
        } else {
            setMobileMenuOpen(false); // 하위 메뉴가 없는 항목 클릭 시, 모바일 메뉴를 닫아 사용자 경험을 개선합니다.
        }
    };

    // 로그아웃 버튼 클릭 시 호출됩니다.
    const handleLogout = async () => {
        await axios.post('/api/logout').catch((err) => console.error("Logout failed", err)); // 백엔드에 로그아웃 요청
        sessionStorage.removeItem('user'); // 세션 스토리지에서 사용자 정보 제거
        navigate('/login'); // 로그인 페이지로 이동
    };

    // --- 사이드 이펙트(Side Effect) 관리 ---
    // useEffect 훅은 location.pathname(URL 경로)이 변경될 때마다 특정 작업을 수행합니다.
    // 다른 페이지로 이동했을 때, 열려있는 모바일 메뉴나 아코디언 메뉴를 자동으로 닫아줍니다.
    useEffect(() => {
        setMobileMenuOpen(false);
        setOpenMenu(null);
    }, [location.pathname]);

    // --- 렌더링 (JSX) ---
    return (
        <div className={styles.pageContainer}>
            {/* 사이드바 Navigation */}
            <nav className={mobileSidebarClasses}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.monarchIcon}>
                        <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <text x="50" y="75" fontFamily="serif" fontSize="90" fontWeight="bold" textAnchor="middle" fill="#007bff">M</text>
                            <rect x="10" y="80" width="80" height="5" fill="#ffffff" />
                        </svg>
                    </span>
                    <span className={styles.logoText}>MONARCH</span>
                    <label className={styles.switch}>
                        <input type="checkbox" checked={isSidebarPinned} onChange={() => setSidebarPinned(!isSidebarPinned)} />
                        <span className={`${styles.slider} ${styles.round}`}></span>
                    </label>
                </div>
                <ul className={styles.menuList}>
                    {menuItems.map((item) => {
                        const hasSubItems = !!(item.subItems && item.subItems.length > 0);
                        const linkPath = getMenuItemLinkPath(item);
                        const isMenuOpen = openMenu === item.name;
                        return (
                            <li key={item.name} className={`${styles.menuItem} ${isMenuOpen ? styles.open : ''}`}>
                                <Link to={linkPath} className={styles.menuLink} onClick={(e) => handleMenuClick(e, item.name, hasSubItems)}>
                                    {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
                                    <span className={styles.menuText}>{item.name}</span>
                                    {hasSubItems && <span className={styles.arrowIcon}></span>}
                                </Link>
                                {hasSubItems && item.subItems && (
                                    <ul className={styles.submenu}>
                                        {item.subItems.map((subItem) => (
                                            <li key={subItem.name}>
                                                <Link to={getMenuItemLinkPath(subItem)}>{subItem.name}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* 메인 콘텐츠 영역 */}
            <div className={mainContentClasses}>
                {/* 상단 바 Header */}
                <header className={styles.topBar}>
                    <div className={styles.headerContent}>
                        <button className={styles.hamburgerButton} onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                            <svg viewBox="0 0 100 80" width="24" height="24" fill="#343a40">
                                <rect width="100" height="15"></rect><rect y="30" width="100" height="15"></rect><rect y="60" width="100" height="15"></rect>
                            </svg>
                        </button>
                        <nav className={styles.topMenu}>
                            {menuItems.map((item) => (
                                <div key={item.name} className={styles.topMenuItem}>
                                    {(() => {
                                        const hasSubItems = !!(item.subItems && item.subItems.length > 0);
                                        const linkPath = getMenuItemLinkPath(item);
                                        return (
                                            <>
                                                <Link to={linkPath} className={styles.topMenuLink}>{item.name}</Link>
                                                {hasSubItems && item.subItems && (
                                                    <ul className={styles.topSubmenu}>
                                                        {item.subItems.map((subItem) => (<li key={subItem.name}><Link to={getMenuItemLinkPath(subItem)}>{subItem.name}</Link></li>))}
                                                    </ul>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            ))}
                        </nav>
                        <div className={styles.userInfo}>
                            <span className={styles.welcomeMessage}>반갑습니다, {user?.USER_NAME || '사용자'} <span className={styles.honorific}>님</span></span>
                            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                        </div>
                    </div>
                </header>

                {/* 실제 페이지 콘텐츠가 렌더링될 영역 */}
                <div className={styles.mainWrapper}>
                    {isMobileMenuOpen && <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)}></div>}
                    {/* App.tsx의 Route 설정에 따라 이 자리에 다른 페이지 컴포넌트가 렌더링됩니다. */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
