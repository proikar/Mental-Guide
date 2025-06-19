package com.example.admin_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.admin_service.entity.Note;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserId(Long userId);
}
