package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.SignRecord;
import com.yuntu.logistics.service.SignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sign")
public class SignController {

    @Autowired
    private SignService signService;

    /**
     * 签收登记
     */
    @PostMapping
    public Result<SignRecord> sign(@RequestBody SignRecord record) {
        return Result.success(signService.sign(record));
    }

    /**
     * 反签收
     */
    @PutMapping("/{waybillId}/unsign")
    public Result<Void> unsign(@PathVariable Long waybillId) {
        signService.unsign(waybillId);
        return Result.success(null);
    }

    /**
     * 分页查询签收记录
     */
    @GetMapping
    public Result<IPage<SignRecord>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String signType) {
        return Result.success(signService.list(new Page<>(page, size), keyword, signType));
    }

    /**
     * 根据运单ID查询签收记录
     */
    @GetMapping("/waybill/{waybillId}")
    public Result<SignRecord> getByWaybillId(@PathVariable Long waybillId) {
        return Result.success(signService.getByWaybillId(waybillId));
    }
}
