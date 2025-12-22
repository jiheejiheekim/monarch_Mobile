package com.kydbm.monarch.service;

import com.kydbm.monarch.domain.MCommCode;
import com.kydbm.monarch.mapper.MCommCodeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MCommCodeService {

    private final MCommCodeMapper mCommCodeMapper;

    public List<MCommCode> getCommCodes(String codeGrp, Long mUsiteNo) {
        return mCommCodeMapper.findByCodeGrpAndUsiteNo(codeGrp, mUsiteNo);
    }
}
