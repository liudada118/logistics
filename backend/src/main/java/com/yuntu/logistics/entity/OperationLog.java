package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_operation_log")
public class OperationLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String module;
    private String action;
    private String description;
    private Long targetId;
    private String targetType;
    private Long operatorId;
    private String operatorName;
    private String ipAddress;
    private LocalDateTime createdAt;
}
