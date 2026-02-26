package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.ExceptionRecord;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.mapper.ExceptionRecordMapper;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.mapper.WaybillStatusLogMapper;
import com.yuntu.logistics.service.ExceptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ExceptionServiceImpl implements ExceptionService {

    @Autowired
    private ExceptionRecordMapper exceptionRecordMapper;
    @Autowired
    private WaybillMapper waybillMapper;
    @Autowired
    private WaybillStatusLogMapper statusLogMapper;

    @Override
    @Transactional
    public ExceptionRecord create(ExceptionRecord record) {
        // 如果关联了运单，获取运单号
        if (record.getWaybillId() != null) {
            Waybill waybill = waybillMapper.selectById(record.getWaybillId());
            if (waybill != null) {
                record.setWaybillNo(waybill.getWaybillNo());
                // 更新运单状态为异常
                waybill.setStatus("异常");
                waybillMapper.updateById(waybill);

                // 记录状态日志
                WaybillStatusLog log = new WaybillStatusLog();
                log.setWaybillId(waybill.getId());
                log.setStatus("异常");
                log.setDescription("异常登记：" + record.getExceptionType() + " - " + record.getDescription());
                log.setOperatorId(record.getReporterId());
                log.setOperatorName(record.getReporterName());
                statusLogMapper.insert(log);
            }
        }

        record.setHandleStatus("待处理");
        exceptionRecordMapper.insert(record);
        return record;
    }

    @Override
    @Transactional
    public void handle(Long id, String handleResult, BigDecimal handleAmount, Long handlerId, String handlerName) {
        ExceptionRecord record = exceptionRecordMapper.selectById(id);
        if (record == null) {
            throw new RuntimeException("异常记录不存在");
        }
        record.setHandleStatus("已处理");
        record.setHandleResult(handleResult);
        record.setHandleAmount(handleAmount != null ? handleAmount : BigDecimal.ZERO);
        record.setHandlerId(handlerId);
        record.setHandlerName(handlerName);
        record.setHandledAt(LocalDateTime.now());
        exceptionRecordMapper.updateById(record);
    }

    @Override
    public void close(Long id) {
        ExceptionRecord record = exceptionRecordMapper.selectById(id);
        if (record == null) {
            throw new RuntimeException("异常记录不存在");
        }
        record.setHandleStatus("已关闭");
        exceptionRecordMapper.updateById(record);
    }

    @Override
    public IPage<ExceptionRecord> list(Page<ExceptionRecord> page, String keyword, String exceptionType, String handleStatus) {
        LambdaQueryWrapper<ExceptionRecord> qw = new LambdaQueryWrapper<>();
        if (exceptionType != null && !exceptionType.isEmpty()) {
            qw.eq(ExceptionRecord::getExceptionType, exceptionType);
        }
        if (handleStatus != null && !handleStatus.isEmpty()) {
            qw.eq(ExceptionRecord::getHandleStatus, handleStatus);
        }
        if (keyword != null && !keyword.isEmpty()) {
            qw.and(w -> w.like(ExceptionRecord::getWaybillNo, keyword)
                    .or().like(ExceptionRecord::getDescription, keyword));
        }
        qw.orderByDesc(ExceptionRecord::getCreatedAt);
        return exceptionRecordMapper.selectPage(page, qw);
    }

    @Override
    public ExceptionRecord getById(Long id) {
        return exceptionRecordMapper.selectById(id);
    }
}
