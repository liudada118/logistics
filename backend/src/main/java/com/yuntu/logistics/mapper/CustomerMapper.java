package com.yuntu.logistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yuntu.logistics.entity.Customer;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CustomerMapper extends BaseMapper<Customer> {
}
