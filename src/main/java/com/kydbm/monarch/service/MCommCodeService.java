package com.kydbm.monarch.service;

import com.kydbm.monarch.domain.MCommCode;
import com.kydbm.monarch.repository.MCommCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MCommCodeService {

    private final MCommCodeRepository mCommCodeRepository;

    public List<MCommCode> getCommCodes(String codeGrp, Long mUsiteNo) {
        // USE_FLAG = '1' 인 항목만 정렬 순서에 맞춰 조회 (Hibernate Repository 사용)
        return mCommCodeRepository.findByCodeGrpAndMUsiteNoAndUseFlag(codeGrp, mUsiteNo, "1");
    }
}
