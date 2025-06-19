package com.example.admin_service.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.admin_service.entity.Chat;
import com.example.admin_service.entity.Note;
import com.example.admin_service.entity.User;
import com.example.admin_service.repository.ChatRepository;
import com.example.admin_service.repository.NoteRepository;
import com.example.admin_service.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;

@RestController
@RequestMapping("/admin")
public class AdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired private UserRepository userRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private NoteRepository noteRepository;
    @Autowired private EntityManager entityManager;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            logger.info("Attempting to fetch all users");
            List<User> users = userRepository.findAll();
            logger.info("Successfully fetched {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users: ", e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", e.getMessage()
            ));
        }
    }

    // Остальные методы оставляем без изменений
    @GetMapping("/chats/{userId}")
    public List<Chat> getChatsByUser(@PathVariable Long userId) {
        return chatRepository.findByUserId(userId);
    }

    @DeleteMapping("/chats/{userId}")
    public void deleteChatsByUser(@PathVariable Long userId) {
        chatRepository.deleteByUserId(userId);
    }

    @GetMapping("/notes/{userId}")
    public List<Note> getNotesByUser(@PathVariable Long userId) {
        return noteRepository.findByUserId(userId);
    }

    @GetMapping("/stats/summary")
    public Map<String, Object> getSummary() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalChats", chatRepository.count());
        stats.put("activeUsers", chatRepository.findAll()
            .stream()
            .map(Chat::getUserId)
            .distinct()
            .count());
        return stats;
    }

    @GetMapping("/stats/registrations")
    public List<Map<String, Object>> getRegistrationsByMonth() {
        List<Tuple> results = entityManager.createQuery(
                "SELECT FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m') as month, COUNT(u) as count " +
                "FROM User u GROUP BY FUNCTION('DATE_FORMAT', u.createdAt, '%Y-%m')", Tuple.class)
                .getResultList();

        return convertTuplesToMaps(results);
    }

    @GetMapping("/stats/messages")
    public List<Map<String, Object>> getMessagesByDay() {
        List<Tuple> results = entityManager.createQuery(
                "SELECT FUNCTION('DATE', c.createdAt) as date, COUNT(c) as count " +
                "FROM Chat c GROUP BY FUNCTION('DATE', c.createdAt)", Tuple.class)
                .getResultList();

        return convertTuplesToMaps(results);
    }

    private List<Map<String, Object>> convertTuplesToMaps(List<Tuple> tuples) {
        return tuples.stream()
                .map(tuple -> {
                    Map<String, Object> map = new HashMap<>();
                    Object periodObj = tuple.get(0);

                    String periodStr;
                    if (periodObj instanceof java.sql.Date) {
                        periodStr = periodObj.toString();
                    } else {
                        periodStr = periodObj != null ? periodObj.toString() : null;
                    }

                    map.put("period", periodStr);
                    map.put("count", tuple.get(1, Long.class));
                    return map;
                })
                .collect(Collectors.toList());
    }
}