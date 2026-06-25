package com.vergiltempo.service;

import com.vergiltempo.dto.ClientDto;
import com.vergiltempo.dto.ClientRequest;
import com.vergiltempo.entity.Client;
import com.vergiltempo.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    public ClientServiceImpl(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToClientDto)
                .collect(Collectors.toList());
    }

    @Override
    public ClientDto createClient(ClientRequest request) {
        String trimmedName = request.getName().trim();
        if (clientRepository.findByName(trimmedName).isPresent()) {
            throw new IllegalArgumentException("Client company already exists");
        }

        String code = trimmedName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (code.length() > 10) {
            code = code.substring(0, 10);
        } else if (code.isEmpty()) {
            code = "CL" + String.format("%04d", (int)(Math.random() * 10000));
        } else {
            int counter = 1;
            String baseCode = code;
            while (clientRepository.findByCode(code).isPresent()) {
                String suffix = String.valueOf(counter);
                int limit = 10 - suffix.length();
                code = (baseCode.length() > limit ? baseCode.substring(0, limit) : baseCode) + suffix;
                counter++;
            }
        }

        Client client = Client.builder()
                .name(trimmedName)
                .code(code)
                .active(true)
                .build();

        Client saved = clientRepository.save(client);
        return mapToClientDto(saved);
    }

    @Override
    public void deleteClientByName(String name) {
        Client client = clientRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Client company not found"));
        clientRepository.delete(client);
    }

    private ClientDto mapToClientDto(Client client) {
        return ClientDto.builder()
                .id(client.getId())
                .name(client.getName())
                .code(client.getCode())
                .active(client.getActive())
                .build();
    }
}
