package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.ExceptionRecord;

public interface ExceptionService {
    /**
     * 登记异常
     */
    ExceptionRecord create(ExceptionRecord record);

    /**
     * 处理异常
     */
    void handle(Long id, String handleResult, java.math.BigDecimal handleAmount, Long handlerId, String handlerName);

    /**
     * 关闭异常
     */
    void close(Long id);

    /**
     * 分页查询异常记录
     */
    IPage<ExceptionRecord> list(Page<ExceptionRecord> page, String keyword, String exceptionType, String handleStatus);

    /**
     * 查询详情
     */
    ExceptionRecord getById(Long id);
}
