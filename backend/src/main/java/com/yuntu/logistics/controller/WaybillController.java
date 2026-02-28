package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.dto.WaybillCreateRequest;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.service.WaybillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/waybills")
@RequiredArgsConstructor
public class WaybillController {

    private final WaybillService waybillService;
    private final WaybillMapper waybillMapper;

    @PostMapping
    public Result<Waybill> createWaybill(
            @Valid @RequestBody WaybillCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Waybill waybill = waybillService.createWaybill(request, currentUser);
        return Result.success(waybill);
    }

    @GetMapping("/{id}")
    public Result<Waybill> getWaybill(@PathVariable Long id) {
        return Result.success(waybillService.getWaybillById(id));
    }

    @GetMapping
    public Result<IPage<Waybill>> listWaybills(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) Long originOrgId,
            @RequestParam(required = false) Long destOrgId) {
        return Result.success(waybillService.listWaybills(page, size, status, keyword));
    }

    @PutMapping("/{id}")
    public Result<Void> updateWaybill(
            @PathVariable Long id,
            @Valid @RequestBody WaybillCreateRequest request) {
        waybillService.updateWaybill(id, request);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteWaybill(@PathVariable Long id) {
        waybillService.deleteWaybill(id);
        return Result.success();
    }

    /** 批量删除运单 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) return Result.error("请选择要删除的运单");
        for (Long id : ids) {
            waybillService.deleteWaybill(id);
        }
        return Result.success();
    }

    /** 更新运单状态（手动调度、取消等） */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String status = body.get("status");
        String description = body.getOrDefault("description", "状态变更为：" + status);
        waybillService.updateStatus(id, status, description, currentUser);
        return Result.success();
    }

    /** 更新回单状态 */
    @PutMapping("/{id}/receipt")
    public Result<Void> updateReceiptStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String receiptStatus = body.get("receiptStatus");
        waybillService.updateReceiptStatus(id, receiptStatus, currentUser);
        return Result.success();
    }

    /** 获取运单状态追踪日志 */
    @GetMapping("/{id}/logs")
    public Result<List<WaybillStatusLog>> getStatusLogs(@PathVariable Long id) {
        return Result.success(waybillService.getStatusLogs(id));
    }

    /** 运单统计（各状态数量） */
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        Map<String, Object> data = new LinkedHashMap<>();
        long total = waybillMapper.selectCount(null);
        data.put("total", total);
        for (String s : List.of("待调度", "已调度", "运输中", "已到货", "派送中", "已签收", "异常", "已取消")) {
            long count = waybillMapper.selectCount(new LambdaQueryWrapper<Waybill>().eq(Waybill::getStatus, s));
            data.put(s, count);
        }
        List<Waybill> all = waybillMapper.selectList(null);
        BigDecimal totalFee = all.stream()
            .map(Waybill::getFreightFee)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.put("totalFreight", totalFee);
        return Result.success(data);
    }
}
