package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("biz_exception_record")
public class ExceptionRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String waybillNo;
    private String exceptionType;     // 货损/货差/延误/丢失/错发/客户投诉/其他
    private String severity;          // 轻微/一般/严重
    private String description;
    private String handleStatus;      // 待处理/处理中/已处理/已关闭
    private String handleResult;
    private BigDecimal handleAmount;  // 理赔金额
    private Long orgId;
    private String orgName;
    private Long reporterId;
    private String reporterName;
    private Long handlerId;
    private String handlerName;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
