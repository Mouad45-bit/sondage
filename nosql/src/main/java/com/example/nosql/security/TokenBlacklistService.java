package com.example.nosql.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {
    private final Map<String, Long> revoked = new ConcurrentHashMap<>();
    //
    public void blackList(String jti, Instant expiresAt) {
        revoked.put(jti, expiresAt.getEpochSecond());
    }
    //
    public boolean isBlackListed(String jti) {
        if (jti == null) return false;
        Long exp = revoked.get(jti);
        if (exp == null) return false;
        //
        if (exp < Instant.now().getEpochSecond()) {
            revoked.remove(jti);
            return false;
        }
        return true;
    }
}
