package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.dto.WaybillCreateRequest;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.service.WaybillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waybills")
@RequiredArgsConstructor
public class WaybillController {

    private final WaybillService waybillService;

    /**
     * 创建运单 - 运费可自由设定，无价格校验
     */
    @PostMapping
    public Result<Waybill> createWaybill(
            @Valid @RequestBody WaybillCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Waybill waybill = waybillService.createWaybill(request, currentUser);
        return Result.success(waybill);
    }

    /**
     * 获取运单详情
     */
    @GetMapping("/{id}")
    public Result<Waybill> getWaybill(@PathVariable Long id) {
        return Result.success(waybillService.getWaybillById(id));
    }

    /**
     * 运单列表（分页 + 筛选 + 搜索）
     */
    @GetMapping
    public Result<IPage<Waybill>> listWaybills(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return Result.success(waybillService.listWaybills(page, size, status, keyword));
    }

    /**
     * 更新运单 - 运费可自由修改，无价格校验
     */
    @PutMapping("/{id}")
    public Result<Void> updateWaybill(
            @PathVariable Long id,
            @Valid @RequestBody WaybillCreateRequest request) {
        waybillService.updateWaybill(id, request);
        return Result.success();
    }

    /**
     * 删除运单
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteWaybill(@PathVariable Long id) {
        waybillService.deleteWaybill(id);
        return Result.success();
    }

    /**
     * 更新回单状态 - 仅需点击"回单已寄出"或"回单已签收"，无需上传任何文件
     */
    @PutMapping("/{id}/receipt")
    public Result<Void> updateReceiptStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        String receiptStatus = body.get("receiptStatus");
        waybillService.updateReceiptStatus(id, receiptStatus, currentUser);
        return Result.success();
    }

    /**
     * 获取运单状态追踪日志
     */
    @GetMapping("/{id}/logs")
    public Result<List<WaybillStatusLog>> getStatusLogs(@PathVariable Long id) {
        return Result.success(waybillService.getStatusLogs(id));
    }
}
