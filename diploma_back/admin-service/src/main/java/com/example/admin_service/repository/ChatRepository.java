package com.example.admin_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.admin_service.entity.Chat;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
