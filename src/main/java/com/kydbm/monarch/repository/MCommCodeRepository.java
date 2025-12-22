package com.kydbm.monarch.repository;

import com.kydbm.monarch.domain.MCommCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * M_COMM_CODE 테이블에 접근하기 위한 Spring Data JPA 레포지토리 인터페이스.
 */
@Repository
public interface MCommCodeRepository extends JpaRepository<MCommCode, Long> {

    /**
     * 코드 그룹, 회원사 번호, 사용 여부를 기준으로 공통 코드를 조회합니다.
     * 정렬 순서(SORT_NO)와 코드명(CODE_NAME) 순으로 정렬합니다.
     */
    @Query("""
            SELECT c FROM MCommCode c
            WHERE c.codeGrp = :codeGrp
              AND c.mUsiteNo = :mUsiteNo
              AND c.useFlag = :useFlag
            ORDER BY c.sortNo ASC, c.codeName ASC
            """)
    List<MCommCode> findByCodeGrpAndMUsiteNoAndUseFlag(
            @Param("codeGrp") String codeGrp,
            @Param("mUsiteNo") Long mUsiteNo,
            @Param("useFlag") String useFlag);
}
