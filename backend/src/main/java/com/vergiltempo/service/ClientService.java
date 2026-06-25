package com.vergiltempo.service;

import com.vergiltempo.dto.ClientDto;
import com.vergiltempo.dto.ClientRequest;
import java.util.List;

public interface ClientService {
    List<ClientDto> getAllClients();
    ClientDto createClient(ClientRequest request);
    void deleteClientByName(String name);
}
