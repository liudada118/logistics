package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("biz_waybill_status_log")
public class WaybillStatusLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long waybillId;
    private String status;
    private String description;
    private Long operatorId;
    private String operatorName;
    private LocalDateTime createdAt;
}
