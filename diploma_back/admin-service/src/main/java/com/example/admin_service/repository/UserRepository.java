package com.example.admin_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.admin_service.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {}