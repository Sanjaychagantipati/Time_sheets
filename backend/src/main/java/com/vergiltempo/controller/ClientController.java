package com.vergiltempo.controller;

import com.vergiltempo.dto.ClientDto;
import com.vergiltempo.dto.ClientRequest;
import com.vergiltempo.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
@PreAuthorize("hasRole('ADMIN')")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public ResponseEntity<List<ClientDto>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @PostMapping
    public ResponseEntity<ClientDto> createClient(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.createClient(request));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteClient(@RequestParam String name) {
        clientService.deleteClientByName(name);
        return ResponseEntity.ok(Map.of("message", "Client company permanently deleted"));
    }
}
