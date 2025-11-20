// React와 관련 훅(Hook)들을 가져옵니다.
import React, { useState, useEffect, useMemo } from 'react';
// 페이지 이동을 위한 Link, 현재 경로 정보를 위한 useLocation, 실제 페이지 콘텐츠가 렌더링될 Outlet을 가져옵니다.
import { Link, Outlet, useLocation } from 'react-router-dom';
// 서버 통신을 위한 axios를 가져옵니다.
import axios from 'axios';
// 이 컴포넌트의 스타일 시트를 가져옵니다.
import styles from './Layout.module.css';
// 프로그래밍 방식으로 페이지를 이동시키기 위한 useNavigate 훅을 가져옵니다.
import { useNavigate } from 'react-router-dom';

// 사용자 정보 객체의 타입을 정의합니다.
interface UserData {
    USER_NAME: string;
    [key: string]: string | number | boolean | null | undefined;
}

// 메뉴 아이템의 타입을 명확하게 정의합니다.
interface MenuItem {
    name: string;
    path?: string;
    structureName?: string;
    icon?: string;
    subItems?: Omit<MenuItem, 'icon' | 'subItems'>[];
}

// 사이드바와 상단 바에서 사용할 메뉴의 구조를 미리 정의합니다.
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
        { name: 'Structure정보', path: '/admin/structure' }, // "Structure정보" 메뉴 항목 새로 추가
        { name: 'Service정보', path: '/admin/service' }
    ] },
];

// 메뉴 아이템으로부터 실제 라우팅 경로를 계산하는 헬퍼 함수
const getMenuItemLinkPath = (item: MenuItem): string => {
    // item 자체에 path가 정의되어 있으면 그것을 사용
    if (item.path) return item.path;
    // item 자체에 structureName이 정의되어 있으면 /grid/ 접두사를 붙여 사용
    if (item.structureName) return `/grid/${item.structureName}`;
    // 하위 메뉴가 있고, 첫 번째 하위 메뉴가 존재하면 그 하위 메뉴의 경로를 사용
    if (item.subItems && item.subItems.length > 0) {
        const firstSub = item.subItems[0];
        // firstSub.path와 firstSub.structureName도 undefined일 수 있으므로 안전하게 접근
        return firstSub.path || (firstSub.structureName ? `/grid/${firstSub.structureName}` : '#');
    }
    return '#'; // 기본값
};

// Layout 컴포넌트의 본체입니다.
const Layout: React.FC = () => {
    // --- 상태(State) 관리 ---
    // isSidebarPinned: 사이드바 고정 여부를 관리하는 상태
    const [isSidebarPinned, setSidebarPinned] = useState(false);
    // isMobileMenuOpen: 모바일 환경에서 사이드바가 열렸는지 관리하는 상태
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    // openMenu: 사이드바의 아코디언 메뉴 중 어떤 메뉴가 열렸는지 관리하는 상태
    const [openMenu, setOpenMenu] = useState<string | null>(null); // 아코디언 메뉴 상태
    
    // --- React Router 훅 ---
    // location: 현재 URL 경로 정보를 담고 있는 객체
    const location = useLocation(); // 페이지 이동 감지를 위해 사용
    // navigate: 페이지를 이동시키는 함수
    const navigate = useNavigate();

    // --- 데이터 관리 ---
    // sessionStorage에서 사용자 정보를 읽어와 파싱합니다.
    // useMemo를 사용하여 컴포넌트가 리렌더링될 때마다 불필요하게 sessionStorage를 읽는 것을 방지합니다.
    const user: UserData | null = useMemo(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    }, []);

    // --- 동적 클래스 이름 관리 ---
    // 사이드바의 상태(고정 여부)에 따라 CSS 클래스를 동적으로 할당합니다.
    const sidebarClasses = `${styles.sidebar} ${isSidebarPinned ? styles.pinned : ''}`;
    // 메인 콘텐츠 영역의 상태(사이드바 고정 여부)에 따라 CSS 클래스를 동적으로 할당합니다.
    const mainContentClasses = `${styles.mainContent} ${isSidebarPinned ? styles.shifted : ''}`;
    // 모바일 환경에서의 사이드바 상태에 따라 CSS 클래스를 동적으로 할당합니다.
    const mobileSidebarClasses = `${sidebarClasses} ${isMobileMenuOpen ? styles.mobileOpen : ''}`;

    // --- 이벤트 핸들러 ---
    // 사이드바 메뉴 클릭 시 호출되는 함수 (아코디언 기능)
    const handleMenuClick = (e: React.MouseEvent, itemName: string, hasSubItems: boolean) => {
        // 하위 메뉴가 있는 항목을 클릭했을 경우
        if (hasSubItems) {
            e.preventDefault(); // 기본 링크 이동 동작을 막습니다.
            // 클릭한 메뉴가 이미 열려있으면 닫고, 아니면 엽니다.
            setOpenMenu(openMenu === itemName ? null : itemName);
        } else {
            // 하위 메뉴가 없는 항목을 클릭하면 모바일 메뉴를 닫습니다. (사용자 경험 향상)
            setMobileMenuOpen(false);
        }
    };

    // 로그아웃 버튼 클릭 시 호출되는 함수
    const handleLogout = async () => {
        // 백엔드에 로그아웃 요청을 보냅니다.
        await axios.post('/api/logout').catch((err) => console.error("Logout failed", err));
        // 세션 스토리지에서 사용자 정보를 제거합니다.
        sessionStorage.removeItem('user');
        // 로그인 페이지로 이동시킵니다.
        navigate('/login');
    };

    // --- 사이드 이펙트(Side Effect) 관리 ---
    // useEffect: location.pathname이 변경될 때마다 특정 작업을 수행합니다.
    // 다른 페이지로 이동했을 때, 열려있는 모바일 메뉴나 아코디언 메뉴를 닫아줍니다.
    useEffect(() => { setMobileMenuOpen(false); setOpenMenu(null); }, [location.pathname]);

    // --- 렌더링 ---
    return (
        <div className={styles.pageContainer}>
            {/* 사이드바 Navigation */}
            <nav className={mobileSidebarClasses}>
                {/* 사이드바 헤더: 로고와 고정 토글 스위치 */}
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
                        // 이 메뉴가 하위 메뉴를 가지고 있는지 확인합니다.
                        const hasSubItems = !!(item.subItems && item.subItems.length > 0); // 하위 메뉴 존재 여부
                        const linkPath = getMenuItemLinkPath(item); // 헬퍼 함수를 사용하여 경로 계산
                        // 이 메뉴가 현재 열려있는지 확인합니다.
                        const isMenuOpen = openMenu === item.name;
                        return (
                            <li key={item.name} className={`${styles.menuItem} ${isMenuOpen ? styles.open : ''}`}>
                                <Link
                                    // 클릭 시 이동할 경로를 설정합니다. 하위 메뉴가 있으면 첫 번째 하위 메뉴 경로로 설정합니다.
                                    to={linkPath}
                                    className={styles.menuLink}
                                    onClick={(e) => handleMenuClick(e, item.name, hasSubItems)}
                                >
                                    {item.icon && <span className={styles.menuIcon}>{item.icon}</span>}
                                    <span className={styles.menuText}>{item.name}</span>
                                    {hasSubItems && <span className={styles.arrowIcon}></span>}
                                </Link>
                                {/* 하위 메뉴가 있으면 렌더링합니다. */}
                                {hasSubItems && item.subItems && ( // item.subItems가 존재함을 명시적으로 확인
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
                        {/* 모바일용 햄버거 버튼 */}
                        <button className={styles.hamburgerButton} onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                            <svg viewBox="0 0 100 80" width="24" height="24" fill="#343a40">
                                <rect width="100" height="15"></rect><rect y="30" width="100" height="15"></rect><rect y="60" width="100" height="15"></rect>
                            </svg>
                        </button>
                        <nav className={styles.topMenu}>
                            {/* 데스크탑용 상단 메뉴 */}
                            {menuItems.map((item) => (
                                <div key={item.name} className={styles.topMenuItem}>
                                    {/*
                                      JSX 내부에서 변수 선언 등의 로직을 사용하기 위해
                                      즉시 실행 함수(IIFE) 패턴 (() => { ... })()을 사용합니다.
                                    */}
                                    {(() => {
                                        const hasSubItems = !!(item.subItems && item.subItems.length > 0); // 하위 메뉴 존재 여부
                                        const linkPath = getMenuItemLinkPath(item); // 헬퍼 함수를 사용하여 경로 계산
                                        return (
                                            <>
                                                <Link to={linkPath} className={styles.topMenuLink}>{item.name}</Link>
                                                {hasSubItems && item.subItems && ( // item.subItems가 존재함을 명시적으로 확인
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
                        {/* 사용자 정보 및 로그아웃 버튼 */}
                        <div className={styles.userInfo}>
                            <span className={styles.welcomeMessage}>반갑습니다, {user?.USER_NAME || '사용자'} <span className={styles.honorific}>님</span></span>
                            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                        </div>
                    </div>
                </header>

                {/* 실제 페이지 콘텐츠가 렌더링될 영역 */}
                <div className={styles.mainWrapper}>
                    {/* 모바일 메뉴가 열렸을 때 배경을 어둡게 만드는 오버레이 */}
                    {isMobileMenuOpen && <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)}></div>}
                    {/* App.tsx의 Route 설정에 따라 이 자리에 다른 페이지 컴포넌트(DashboardPage 등)가 들어옵니다. */}
                    <Outlet /> {/* 이 부분이 페이지의 실제 내용으로 교체됩니다. */}
                </div>
            </div>
        </div>
    );
};

export default Layout;
