package com.example.notes_service.repository;

import com.example.notes_service.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserId(Long userId);
    
    @Query("SELECT n FROM Note n WHERE n.id = :id AND n.userId = :userId")
    Optional<Note> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
    
    default Optional<Note> findUserNote(Long id, Long userId) {
        System.out.println("Finding note with id=" + id + " for user=" + userId);
        return findByIdAndUserId(id, userId);
    }
}