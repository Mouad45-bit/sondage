package com.example.nosql.config;

import com.example.nosql.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider daoAuthProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder encoder
    ) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(encoder);
        return p;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            AuthenticationProvider authProvider,
            JwtAuthFilter jwtAuthFilter
    ) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ✅ important: éviter que /error provoque des soucis
                        .requestMatchers("/error", "/error/**").permitAll()

                        // ✅ auth public (tu veux rester avec /auth/*)
                        .requestMatchers("/auth/**").permitAll()

                        // ✅ lecture publique des polls
                        .requestMatchers(HttpMethod.GET, "/api/polls/**").permitAll()

                        // ✅ lecture publique users (si tu veux vraiment)
                        .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()

                        // ✅ progress protégé
                        .requestMatchers(HttpMethod.GET, "/api/polls/*/progress").authenticated()

                        // ✅ logout protégé
                        .requestMatchers(HttpMethod.POST, "/auth/logout").authenticated()

                        // ✅ CRUD polls protégé
                        .requestMatchers(HttpMethod.POST, "/api/polls").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/polls/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/polls/**").authenticated()

                        // ton endpoint réel est très probablement /api/polls/{pollId}/votes
                        .requestMatchers(HttpMethod.POST, "/api/polls/*/votes").authenticated()

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}