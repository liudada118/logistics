package com.yuntu.logistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yuntu.logistics.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT u.*, o.name AS org_name FROM sys_user u LEFT JOIN sys_organization o ON u.org_id = o.id WHERE u.username = #{username} AND u.status = 1")
    User findByUsername(String username);
}
