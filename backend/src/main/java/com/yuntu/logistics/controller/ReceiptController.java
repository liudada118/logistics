package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.ReceiptRecord;
import com.yuntu.logistics.service.ReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receipt")
public class ReceiptController {

    @Autowired
    private ReceiptService receiptService;

    /**
     * 回单签收
     */
    @PostMapping("/{waybillId}/sign")
    public Result<Void> signReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        String remark = (String) body.getOrDefault("remark", "");
        receiptService.signReceipt(waybillId, operatorId, operatorName, orgId, remark);
        return Result.success(null);
    }

    /**
     * 回单寄出
     */
    @PostMapping("/{waybillId}/send")
    public Result<Void> sendReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        String expressNo = (String) body.getOrDefault("expressNo", "");
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        String remark = (String) body.getOrDefault("remark", "");
        receiptService.sendReceipt(waybillId, expressNo, operatorId, operatorName, orgId, remark);
        return Result.success(null);
    }

    /**
     * 回单收到
     */
    @PostMapping("/{waybillId}/receive")
    public Result<Void> receiveReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        String remark = (String) body.getOrDefault("remark", "");
        receiptService.receiveReceipt(waybillId, operatorId, operatorName, orgId, remark);
        return Result.success(null);
    }

    /**
     * 回单返厂
     */
    @PostMapping("/{waybillId}/return")
    public Result<Void> returnReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        String remark = (String) body.getOrDefault("remark", "");
        receiptService.returnReceipt(waybillId, operatorId, operatorName, orgId, remark);
        return Result.success(null);
    }

    /**
     * 反签收
     */
    @PostMapping("/{waybillId}/unsign")
    public Result<Void> unsignReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        receiptService.unsignReceipt(waybillId, operatorId, operatorName, orgId);
        return Result.success(null);
    }

    /**
     * 反寄出
     */
    @PostMapping("/{waybillId}/unsend")
    public Result<Void> unsendReceipt(@PathVariable Long waybillId, @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.parseLong(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.getOrDefault("operatorName", "");
        Long orgId = body.get("orgId") != null ? Long.parseLong(body.get("orgId").toString()) : null;
        receiptService.unsendReceipt(waybillId, operatorId, operatorName, orgId);
        return Result.success(null);
    }

    /**
     * 查询运单的回单操作记录
     */
    @GetMapping("/waybill/{waybillId}")
    public Result<List<ReceiptRecord>> getByWaybillId(@PathVariable Long waybillId) {
        return Result.success(receiptService.getByWaybillId(waybillId));
    }

    /**
     * 分页查询回单记录
     */
    @GetMapping
    public Result<IPage<ReceiptRecord>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String action) {
        return Result.success(receiptService.list(new Page<>(page, size), keyword, action));
    }
}
