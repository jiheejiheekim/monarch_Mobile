package com.kydbm.monarch.controller;

import com.kydbm.monarch.domain.MCommCode;
import com.kydbm.monarch.service.MCommCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/comm-code")
@RequiredArgsConstructor
public class MCommCodeController {

    private final MCommCodeService mCommCodeService;

    @GetMapping
    public List<MCommCode> getCommCodes(
            @RequestParam("codeGrp") String codeGrp,
            @RequestParam("mUsiteNo") Long mUsiteNo) {
        return mCommCodeService.getCommCodes(codeGrp, mUsiteNo);
    }
}
