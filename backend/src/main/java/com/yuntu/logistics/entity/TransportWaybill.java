package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("biz_transport_waybill")
public class TransportWaybill {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long transportTaskId;
    private Long waybillId;
    private LocalDateTime createdAt;
}
