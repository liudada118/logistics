package com.yuntu.logistics.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yuntu.logistics.entity.SignRecord;

public interface SignService {
    /**
     * 签收登记 - 创建签收记录并更新运单状态
     */
    SignRecord sign(SignRecord record);

    /**
     * 反签收 - 撤销签收
     */
    void unsign(Long waybillId);

    /**
     * 分页查询签收记录
     */
    IPage<SignRecord> list(Page<SignRecord> page, String keyword, String signType);

    /**
     * 根据运单ID查询签收记录
     */
    SignRecord getByWaybillId(Long waybillId);
}
