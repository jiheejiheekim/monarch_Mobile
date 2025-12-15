import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css'; // CSS 모듈 가져오기

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUser');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }

        // Spring Security의 formLogin은 application/x-www-form-urlencoded 형식을 사용합니다.
        // URLSearchParams를 사용하면 더 간결하게 표현할 수 있습니다.
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            await axios.post('/api/login', formData);

            // 로그인 성공 후, 변경된 API(/api/user/info)로 사용자 정보를 가져옵니다.
            const response = await axios.get('/api/user/info');
            const user = response.data;
            
            // sessionStorage에 직접 사용자 정보를 저장합니다.
            sessionStorage.setItem('user', JSON.stringify(user));

            navigate('/'); // 메인 페이지로 이동합니다.
        } catch (err) {
            setError('Login failed. Please check your username and password.');
            console.error('Login error:', err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <div className={styles.logoText}>MONARCH</div>
                    <p className={styles.subtitle}>Welcome back! Please sign in.</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>
                    <div className={styles.rememberMe}>
                        <input
                            id="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="rememberMe">Remember ID</label>
                    </div>
                    <button type="submit" className={styles.submitButton}>Login</button>
                </form>
                {error && <p className={styles.error}>{error}</p>}
            </div>
        </div>
    );
};

export default LoginPage;