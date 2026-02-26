package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.Inventory;
import com.yuntu.logistics.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryMapper inventoryMapper;

    /** 分页查询库存 */
    @GetMapping
    public Result<IPage<Inventory>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long orgId,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<Inventory> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) wrapper.eq(Inventory::getStatus, status);
        if (orgId != null) wrapper.eq(Inventory::getOrgId, orgId);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Inventory::getGoodsName, keyword).or().like(Inventory::getReceiverName, keyword));
        }
        wrapper.orderByDesc(Inventory::getInboundAt);
        return Result.success(inventoryMapper.selectPage(new Page<>(page, size), wrapper));
    }

    /** 确认出库 */
    @PutMapping("/{id}/outbound")
    public Result<Void> outbound(@PathVariable Long id) {
        Inventory item = inventoryMapper.selectById(id);
        if (item == null) return Result.error("库存记录不存在");
        if (!"待出库".equals(item.getStatus())) return Result.error("当前状态不可出库");
        item.setStatus("已出库");
        item.setOutboundAt(LocalDateTime.now());
        inventoryMapper.updateById(item);
        return Result.success(null);
    }

    /** 批量出库 */
    @PutMapping("/batch-outbound")
    public Result<Void> batchOutbound(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) return Result.error("请选择要出库的货物");
        LocalDateTime now = LocalDateTime.now();
        for (Long id : ids) {
            Inventory item = inventoryMapper.selectById(id);
            if (item != null && "待出库".equals(item.getStatus())) {
                item.setStatus("已出库");
                item.setOutboundAt(now);
                inventoryMapper.updateById(item);
            }
        }
        return Result.success(null);
    }

    /** 查询详情 */
    @GetMapping("/{id}")
    public Result<Inventory> detail(@PathVariable Long id) {
        return Result.success(inventoryMapper.selectById(id));
    }
}
