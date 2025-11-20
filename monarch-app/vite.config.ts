// Vite 설정을 위한 defineConfig 함수를 가져옵니다.
import { defineConfig } from 'vite'
// React 프로젝트를 위한 Vite 플러그인을 가져옵니다.
import react from '@vitejs/plugin-react';

// Vite 설정을 정의하고 내보냅니다.
export default defineConfig({
  // 사용할 플러그인 목록을 설정합니다. 여기서는 React 플러그인을 사용합니다.
  plugins: [react()],
  // 모듈 경로를 해석하는 방식을 설정합니다.
  resolve: {
    // 경로 별칭(alias)을 설정합니다.
  },
  // 개발 서버 관련 설정을 정의합니다.
  server: {
    // 프록시(proxy) 설정을 정의합니다.
    // 개발 중 CORS(Cross-Origin Resource Sharing) 문제를 해결하기 위해 사용됩니다.
    proxy: {
      // 프론트엔드에서 '/api'로 시작하는 모든 HTTP 요청을 가로챕니다.
      '/api': { 
        // 가로챈 요청을 전달할 실제 백엔드 서버의 주소입니다. (Spring Boot 서버)
        target: 'http://localhost:8080',
        // 출처(Origin)를 대상 서버의 주소로 변경합니다.
        // 이 설정을 통해 백엔드 서버는 마치 동일한 출처에서 온 요청처럼 인식하게 되어 CORS 오류가 발생하지 않습니다.
        changeOrigin: true,
      },
    }
  }
})