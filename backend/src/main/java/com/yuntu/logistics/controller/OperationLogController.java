package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.OperationLog;
import com.yuntu.logistics.mapper.OperationLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operation-logs")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogMapper operationLogMapper;

    /** 分页查询操作日志 */
    @GetMapping
    public Result<IPage<OperationLog>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(module)) wrapper.eq(OperationLog::getModule, module);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                .like(OperationLog::getDescription, keyword)
                .or().like(OperationLog::getOperatorName, keyword)
            );
        }
        wrapper.orderByDesc(OperationLog::getCreatedAt);
        return Result.success(operationLogMapper.selectPage(new Page<>(page, size), wrapper));
    }
}
