package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.Alert;
import com.yuntu.logistics.entity.User;
import com.yuntu.logistics.mapper.AlertMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertMapper alertMapper;

    /** 分页查询预警 */
    @GetMapping
    public Result<IPage<Alert>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String level) {
        LambdaQueryWrapper<Alert> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(type)) wrapper.eq(Alert::getType, type);
        if (StringUtils.hasText(status)) wrapper.eq(Alert::getStatus, status);
        if (StringUtils.hasText(level)) wrapper.eq(Alert::getLevel, level);
        wrapper.orderByDesc(Alert::getCreatedAt);
        return Result.success(alertMapper.selectPage(new Page<>(page, size), wrapper));
    }

    /** 预警统计 */
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        Map<String, Object> data = new HashMap<>();
        data.put("unhandled", alertMapper.countUnhandled());
        data.put("total", alertMapper.selectCount(null));
        return Result.success(data);
    }

    /** 处理预警 */
    @PutMapping("/{id}/handle")
    public Result<Void> handle(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) return Result.error("预警记录不存在");
        alert.setStatus("已处理");
        alert.setHandlerId(currentUser != null ? currentUser.getId() : null);
        alert.setHandlerName(currentUser != null ? currentUser.getFullName() : "系统");
        alert.setHandledAt(LocalDateTime.now());
        alertMapper.updateById(alert);
        return Result.success(null);
    }

    /** 忽略预警 */
    @PutMapping("/{id}/ignore")
    public Result<Void> ignore(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) return Result.error("预警记录不存在");
        alert.setStatus("已忽略");
        alert.setHandlerId(currentUser != null ? currentUser.getId() : null);
        alert.setHandlerName(currentUser != null ? currentUser.getFullName() : "系统");
        alert.setHandledAt(LocalDateTime.now());
        alertMapper.updateById(alert);
        return Result.success(null);
    }

    /** 标记已读 */
    @PutMapping("/{id}/read")
    public Result<Void> read(@PathVariable Long id) {
        Alert alert = alertMapper.selectById(id);
        if (alert == null) return Result.error("预警记录不存在");
        if ("未处理".equals(alert.getStatus())) {
            alert.setStatus("已处理");
            alert.setHandledAt(LocalDateTime.now());
            alertMapper.updateById(alert);
        }
        return Result.success(null);
    }

    /** 批量标记已读 */
    @PutMapping("/batch-read")
    public Result<Void> batchRead(@RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) return Result.error("请选择要标记的记录");
        for (Long id : ids) {
            Alert alert = alertMapper.selectById(id);
            if (alert != null && "未处理".equals(alert.getStatus())) {
                alert.setStatus("已处理");
                alert.setHandledAt(LocalDateTime.now());
                alertMapper.updateById(alert);
            }
        }
        return Result.success(null);
    }
}
