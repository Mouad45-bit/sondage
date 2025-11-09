package com.example.nosql.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {
    private final Key key;
    //
    public JwtService(@Value("${jwt.secret}") String secretBase64) {
        byte[] decodeBase64 = Decoders.BASE64.decode(secretBase64);
        if (decodeBase64.length < 32) {
            throw new IllegalArgumentException("Secret Base64 length must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(decodeBase64);
    }
    //
    public String generateToken(String username) {
        long now = System.currentTimeMillis();
        //
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + 1000L * 60 * 60 * 24))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    //
    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }
}
