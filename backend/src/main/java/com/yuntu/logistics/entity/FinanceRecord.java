package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_finance_record")
public class FinanceRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String waybillNo;
    private String type;           // 应收/应付/代收货款
    private BigDecimal amount;
    private String paymentMethod;
    private String status;         // 待结算/已结算/已核销/已取消
    private String customerName;
    private Long orgId;
    private String orgName;
    private String remark;
    private LocalDateTime settledAt;
    private LocalDateTime verifiedAt;  // 核销时间
    private Long creatorId;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
