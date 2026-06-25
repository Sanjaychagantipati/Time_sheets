package com.vergiltempo.service;

import com.vergiltempo.dto.ClientDto;
import com.vergiltempo.dto.ClientRequest;
import com.vergiltempo.entity.Client;
import com.vergiltempo.repository.ClientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ClientServiceTest {

    private ClientRepository clientRepository;
    private ClientService clientService;

    @BeforeEach
    public void setUp() {
        clientRepository = Mockito.mock(ClientRepository.class);
        clientService = new ClientServiceImpl(clientRepository);
    }

    @Test
    public void testGetAllClients() {
        Client c1 = Client.builder().id(1).name("Google").code("GOOGLE").active(true).build();
        Client c2 = Client.builder().id(2).name("Meta").code("META").active(true).build();

        when(clientRepository.findAll()).thenReturn(Arrays.asList(c1, c2));

        List<ClientDto> result = clientService.getAllClients();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Google", result.get(0).getName());
        assertEquals("Meta", result.get(1).getName());
    }

    @Test
    public void testCreateClientSuccess() {
        ClientRequest request = new ClientRequest("Google");
        Client saved = Client.builder().id(1).name("Google").code("GOOGLE").active(true).build();

        when(clientRepository.findByName("Google")).thenReturn(Optional.empty());
        when(clientRepository.findByCode("GOOGLE")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenReturn(saved);

        ClientDto response = clientService.createClient(request);

        assertNotNull(response);
        assertEquals("Google", response.getName());
        assertEquals("GOOGLE", response.getCode());
        assertTrue(response.getActive());
    }

    @Test
    public void testCreateClientDuplicateName() {
        ClientRequest request = new ClientRequest("Google");
        Client existing = Client.builder().id(1).name("Google").code("GOOGLE").active(true).build();

        when(clientRepository.findByName("Google")).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> clientService.createClient(request));
    }

    @Test
    public void testCreateClientCodeGenerationSpecialCharacters() {
        ClientRequest request = new ClientRequest("Google Inc. / Tech");
        Client saved = Client.builder().id(1).name("Google Inc. / Tech").code("GOOGLEINCT").active(true).build();

        when(clientRepository.findByName("Google Inc. / Tech")).thenReturn(Optional.empty());
        when(clientRepository.findByCode("GOOGLEINCT")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> {
            Client c = invocation.getArgument(0);
            assertEquals("GOOGLEINCT", c.getCode());
            return saved;
        });

        ClientDto response = clientService.createClient(request);
        assertNotNull(response);
        assertEquals("GOOGLEINCT", response.getCode());
    }

    @Test
    public void testCreateClientCodeGenerationCollision() {
        ClientRequest request = new ClientRequest("Google");
        Client existingWithSameCode = Client.builder().id(1).name("Google Core").code("GOOGLE").active(true).build();
        Client saved = Client.builder().id(2).name("Google").code("GOOGLE1").active(true).build();

        when(clientRepository.findByName("Google")).thenReturn(Optional.empty());
        when(clientRepository.findByCode("GOOGLE")).thenReturn(Optional.of(existingWithSameCode));
        when(clientRepository.findByCode("GOOGLE1")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(invocation -> {
            Client c = invocation.getArgument(0);
            assertEquals("GOOGLE1", c.getCode());
            return saved;
        });

        ClientDto response = clientService.createClient(request);
        assertNotNull(response);
        assertEquals("GOOGLE1", response.getCode());
    }

    @Test
    public void testDeleteClientSuccess() {
        Client client = Client.builder().id(1).name("Google").code("GOOGLE").active(true).build();

        when(clientRepository.findByName("Google")).thenReturn(Optional.of(client));
        doNothing().when(clientRepository).delete(client);

        clientService.deleteClientByName("Google");

        verify(clientRepository, times(1)).delete(client);
    }

    @Test
    public void testDeleteClientNotFound() {
        when(clientRepository.findByName("Google")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> clientService.deleteClientByName("Google"));
    }
}
