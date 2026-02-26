package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.FinanceRecord;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    /** 分页查询财务记录 */
    @GetMapping
    public Result<IPage<FinanceRecord>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return Result.success(financeService.page(page, size, type, status, keyword));
    }

    /** 结算 */
    @PutMapping("/{id}/settle")
    public Result<Void> settle(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        financeService.settle(id, currentUser);
        return Result.success(null);
    }

    /** 批量结算 */
    @PutMapping("/batch-settle")
    public Result<Void> batchSettle(@RequestBody Map<String, List<Long>> body, @AuthenticationPrincipal User currentUser) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) return Result.error("请选择要结算的记录");
        financeService.batchSettle(ids, currentUser);
        return Result.success(null);
    }

    /** 核销 */
    @PutMapping("/{id}/verify")
    public Result<Void> verify(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        financeService.verify(id, currentUser);
        return Result.success(null);
    }

    /** 批量核销 */
    @PutMapping("/batch-verify")
    public Result<Void> batchVerify(@RequestBody Map<String, List<Long>> body, @AuthenticationPrincipal User currentUser) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) return Result.error("请选择要核销的记录");
        financeService.batchVerify(ids, currentUser);
        return Result.success(null);
    }

    /** 取消 */
    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        financeService.cancel(id, currentUser);
        return Result.success(null);
    }

    /** 财务汇总 */
    @GetMapping("/summary")
    public Result<Map<String, Object>> summary() {
        return Result.success(financeService.summary());
    }

    /** 月度趋势 */
    @GetMapping("/trend")
    public Result<List<Map<String, Object>>> trend() {
        return Result.success(financeService.monthlyTrend());
    }

    /** 根据运单生成财务记录 */
    @PostMapping("/generate/{waybillId}")
    public Result<Void> generate(@PathVariable Long waybillId) {
        financeService.generateFinanceRecords(waybillId);
        return Result.success(null);
    }
}
