package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_alert")
public class Alert {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String type;
    private String level;       // 低/中/高
    private String title;
    private String content;
    private Long targetId;
    private String targetType;  // waybill/inventory/finance
    private Long orgId;
    private String status;      // 未处理/已处理/已忽略
    private Long handlerId;
    private String handlerName;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
