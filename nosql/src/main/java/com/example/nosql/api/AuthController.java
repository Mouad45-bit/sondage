package com.example.nosql.api;

import com.example.nosql.api.dto.AuthResponse;
import com.example.nosql.api.dto.LoginRequest;
import com.example.nosql.api.dto.RegisterRequest;
import com.example.nosql.model.User;
import com.example.nosql.security.JwtService;
import com.example.nosql.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    //
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        User user = userService.register(req);
        String token = jwtService.generateToken(user.getUsername());
        //
        return ResponseEntity.ok(new AuthResponse(token));
    }
    //
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        var authToken = new UsernamePasswordAuthenticationToken(
                req.username(),
                req.password()
        );
        //
        authManager.authenticate(authToken);
        //
        String token = jwtService.generateToken(req.username().toLowerCase().trim());
        //
        return ResponseEntity.ok(new AuthResponse(token));
    }
}
