package com.example.admin_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {
    
    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final String ADMIN_TOKEN = "admin-dummy-token";
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> adminLogin(@RequestBody LoginRequest request) {
        if (!ADMIN_EMAIL.equalsIgnoreCase(request.getEmail())) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Неверный email"
            ));
        }
        
        if (!ADMIN_PASSWORD.equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Неверный пароль"
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "isAdmin", true,
            "token", ADMIN_TOKEN,
            "message", "Вход выполнен успешно"
        ));
    }
    
    static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
}