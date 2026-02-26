package com.yuntu.logistics.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.common.Result;
import com.yuntu.logistics.entity.ExceptionRecord;
import com.yuntu.logistics.service.ExceptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/exception")
public class ExceptionController {

    @Autowired
    private ExceptionService exceptionService;

    /**
     * 登记异常
     */
    @PostMapping
    public Result<ExceptionRecord> create(@RequestBody ExceptionRecord record) {
        return Result.success(exceptionService.create(record));
    }

    /**
     * 处理异常
     */
    @PutMapping("/{id}/handle")
    public Result<Void> handle(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String handleResult = (String) body.get("handleResult");
        BigDecimal handleAmount = body.get("handleAmount") != null
                ? new BigDecimal(body.get("handleAmount").toString()) : BigDecimal.ZERO;
        Long handlerId = body.get("handlerId") != null
                ? Long.parseLong(body.get("handlerId").toString()) : null;
        String handlerName = (String) body.get("handlerName");
        exceptionService.handle(id, handleResult, handleAmount, handlerId, handlerName);
        return Result.success(null);
    }

    /**
     * 关闭异常
     */
    @PutMapping("/{id}/close")
    public Result<Void> close(@PathVariable Long id) {
        exceptionService.close(id);
        return Result.success(null);
    }

    /**
     * 分页查询异常记录
     */
    @GetMapping
    public Result<IPage<ExceptionRecord>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String exceptionType,
            @RequestParam(required = false) String handleStatus) {
        return Result.success(exceptionService.list(new Page<>(page, size), keyword, exceptionType, handleStatus));
    }

    /**
     * 查询异常详情
     */
    @GetMapping("/{id}")
    public Result<ExceptionRecord> getById(@PathVariable Long id) {
        return Result.success(exceptionService.getById(id));
    }
}
