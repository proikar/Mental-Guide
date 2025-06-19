package com.example.notes_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.notes_service.entity.Note;
import com.example.notes_service.repository.NoteRepository;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/notes")
public class NoteController {

    @Autowired
    private NoteRepository repo;

    private Long getUserId(HttpServletRequest request) {
    Object userId = request.getAttribute("userId");
    if (userId == null) {
        throw new IllegalStateException("User ID not found in request attributes");
    }
    return Long.valueOf(userId.toString());
}

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> request, 
                                  HttpServletRequest httpRequest) {
        try {
            Long userId = getUserId(httpRequest);
            String content = request.get("content");
            
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }
            
            Note note = new Note();
            note.setUserId(userId);
            note.setContent(content);
            
            Note savedNote = repo.save(note);
            return ResponseEntity.ok(savedNote);
        } catch (Exception e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @GetMapping
    public List<Note> getAll(HttpServletRequest request) {
        Long userId = getUserId(request);
        return repo.findByUserId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> getOne(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        return repo.findById(id)
            .filter(note -> note.getUserId().equals(userId))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(403).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> update(@PathVariable Long id, @RequestBody Note updatedNote, HttpServletRequest request) {
        Long userId = getUserId(request);
        return repo.findById(id)
            .filter(note -> note.getUserId().equals(userId))
            .map(note -> {
                note.setContent(updatedNote.getContent());
                return ResponseEntity.ok(repo.save(note));
            })
            .orElse(ResponseEntity.status(403).build());
    }

    @DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
    Long userId = getUserId(request);
    return repo.findById(id)
        .filter(note -> note.getUserId().equals(userId))
        .map(note -> {
            repo.delete(note);
            return ResponseEntity.ok().<Void>build();
        })
        .orElseGet(() -> ResponseEntity.status(403).build());
}

}
