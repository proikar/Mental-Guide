package com.example.auth.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String password;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    
    // Конструкторы
    public User() {
        this.createdAt = LocalDateTime.now();
        this.role = "USER"; // Роль по умолчанию
    }
    
    public User(String username, String password, String email, String role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role != null ? role : "USER";
        this.createdAt = LocalDateTime.now();
    }
}