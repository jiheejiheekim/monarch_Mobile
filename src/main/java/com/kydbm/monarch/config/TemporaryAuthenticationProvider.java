package com.kydbm.monarch.config;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

/** 
 * 특정 사용자('khma')에 대해 비밀번호 검증을 생략하는 임시 인증 공급자.
 * 개발 및 테스트 단계에서 빠른 로그인을 위해 사용됩니다.
 */
public class TemporaryAuthenticationProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;

    public TemporaryAuthenticationProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = authentication.getName();

        // 로그인 시도한 사용자가 'khma'일 경우에만 특별 로직을 실행합니다.
        if ("khma".equals(username) || "jihee2518".equals(username)) {
            // 데이터베이스에서 'khma' 사용자의 정보를 불러옵니다.
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            // 비밀번호 검증 없이 바로 인증 성공으로 처리합니다.
            return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        }

        // 'khma'가 아니면, 이 Provider는 인증을 처리하지 않고 null을 반환합니다.
        // 그러면 `ProviderManager`는 다음 인증 공급자(DaoAuthenticationProvider)에게 처리를 위임합니다.
        return null;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        // 이 Provider는 아이디/비밀번호 기반의 인증 방식만 지원함을 명시합니다.
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}