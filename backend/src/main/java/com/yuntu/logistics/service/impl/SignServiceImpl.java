package com.yuntu.logistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.SignRecord;
import com.yuntu.logistics.entity.Waybill;
import com.yuntu.logistics.entity.WaybillStatusLog;
import com.yuntu.logistics.mapper.SignRecordMapper;
import com.yuntu.logistics.mapper.WaybillMapper;
import com.yuntu.logistics.mapper.WaybillStatusLogMapper;
import com.yuntu.logistics.service.SignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SignServiceImpl implements SignService {

    @Autowired
    private SignRecordMapper signRecordMapper;
    @Autowired
    private WaybillMapper waybillMapper;
    @Autowired
    private WaybillStatusLogMapper statusLogMapper;

    @Override
    @Transactional
    public SignRecord sign(SignRecord record) {
        // 查询运单
        Waybill waybill = waybillMapper.selectById(record.getWaybillId());
        if (waybill == null) {
            throw new RuntimeException("运单不存在");
        }
        if ("已签收".equals(waybill.getStatus())) {
            throw new RuntimeException("运单已签收，不可重复签收");
        }

        // 设置签收信息
        record.setWaybillNo(waybill.getWaybillNo());
        record.setSignedAt(LocalDateTime.now());
        signRecordMapper.insert(record);

        // 更新运单状态
        waybill.setStatus("已签收");
        waybill.setSignedAt(LocalDateTime.now());
        waybill.setSignerName(record.getSignerName());
        waybill.setSignRemark(record.getSignRemark());

        // 如果是拒签，标记为异常
        if ("拒签".equals(record.getSignType())) {
            waybill.setStatus("异常");
        }

        waybillMapper.updateById(waybill);

        // 记录状态日志
        WaybillStatusLog log = new WaybillStatusLog();
        log.setWaybillId(waybill.getId());
        log.setStatus(waybill.getStatus());
        log.setDescription(record.getSignType() + " - 签收人：" + record.getSignerName()
                + (record.getDamageQuantity() != null && record.getDamageQuantity() > 0 ? "，破损" + record.getDamageQuantity() + "件" : "")
                + (record.getShortageQuantity() != null && record.getShortageQuantity() > 0 ? "，短少" + record.getShortageQuantity() + "件" : ""));
        log.setOperatorId(record.getOperatorId());
        log.setOperatorName(record.getOperatorName());
        statusLogMapper.insert(log);

        return record;
    }

    @Override
    @Transactional
    public void unsign(Long waybillId) {
        Waybill waybill = waybillMapper.selectById(waybillId);
        if (waybill == null) {
            throw new RuntimeException("运单不存在");
        }
        if (!"已签收".equals(waybill.getStatus())) {
            throw new RuntimeException("运单未签收，无法反签收");
        }

        // 恢复运单状态
        waybill.setStatus("已到货");
        waybill.setSignedAt(null);
        waybill.setSignerName("");
        waybill.setSignRemark("");
        waybillMapper.updateById(waybill);

        // 删除签收记录
        LambdaQueryWrapper<SignRecord> qw = new LambdaQueryWrapper<>();
        qw.eq(SignRecord::getWaybillId, waybillId);
        signRecordMapper.delete(qw);

        // 记录状态日志
        WaybillStatusLog log = new WaybillStatusLog();
        log.setWaybillId(waybillId);
        log.setStatus("已到货");
        log.setDescription("反签收操作，恢复为已到货状态");
        statusLogMapper.insert(log);
    }

    @Override
    public IPage<SignRecord> list(Page<SignRecord> page, String keyword, String signType) {
        LambdaQueryWrapper<SignRecord> qw = new LambdaQueryWrapper<>();
        if (signType != null && !signType.isEmpty()) {
            qw.eq(SignRecord::getSignType, signType);
        }
        if (keyword != null && !keyword.isEmpty()) {
            qw.and(w -> w.like(SignRecord::getWaybillNo, keyword)
                    .or().like(SignRecord::getSignerName, keyword));
        }
        qw.orderByDesc(SignRecord::getSignedAt);
        return signRecordMapper.selectPage(page, qw);
    }

    @Override
    public SignRecord getByWaybillId(Long waybillId) {
        LambdaQueryWrapper<SignRecord> qw = new LambdaQueryWrapper<>();
        qw.eq(SignRecord::getWaybillId, waybillId).orderByDesc(SignRecord::getSignedAt).last("LIMIT 1");
        return signRecordMapper.selectOne(qw);
    }
}
