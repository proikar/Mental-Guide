package com.example.notes_service.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) 
            throws ServletException, IOException {
    
    System.out.println("Processing request to: " + request.getRequestURI());
    
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
        System.out.println("Allowing OPTIONS request");
        filterChain.doFilter(request, response);
        return;
    }

    String authHeader = request.getHeader("Authorization");
    System.out.println("Auth header: " + authHeader);
    
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        System.out.println("Missing or invalid Authorization header");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
        return;
    }

    String token = authHeader.substring(7);
    System.out.println("Token received: " + token);
    
    try {
            Claims claims = JwtUtil.parseToken(token);
            System.out.println("Claims: " + claims);
            
            Long userId = claims.get("userId", Long.class);
            System.out.println("Extracted userId: " + userId);
            
            if (userId == null) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token: missing userId");
                return;
            }

            // Устанавливаем userId как атрибут запроса
            request.setAttribute("userId", userId);
            
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    List.of(new SimpleGrantedAuthority("USER"))
                );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("Authentication set for userId: " + userId);
            
            filterChain.doFilter(request, response);
            
        } catch (Exception e) {
            System.out.println("Token validation failed: " + e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token: " + e.getMessage());
        }
    }
}