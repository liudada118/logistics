package com.yuntu.logistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_organization")
public class Organization {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String type; // 总部/分拨中心/落点/营业部
    private Long parentId;
    private String address;
    private String contactName;
    private String contactPhone;
    private Integer status; // 1-启用 0-停用
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private String parentName;
}
