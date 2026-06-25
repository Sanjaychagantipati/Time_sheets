package com.vergiltempo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vergiltempo.dto.ClientDto;
import com.vergiltempo.dto.ClientRequest;
import com.vergiltempo.security.JwtAuthenticationFilter;
import com.vergiltempo.service.ClientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClientController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ClientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClientService clientService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testGetAllClients() throws Exception {
        ClientDto c1 = ClientDto.builder().id(1).name("Google").code("GOOGLE").active(true).build();
        ClientDto c2 = ClientDto.builder().id(2).name("Meta").code("META").active(true).build();

        when(clientService.getAllClients()).thenReturn(Arrays.asList(c1, c2));

        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].name").value("Google"))
                .andExpect(jsonPath("$[1].name").value("Meta"));
    }

    @Test
    public void testCreateClient() throws Exception {
        ClientRequest request = new ClientRequest("Google");
        ClientDto response = ClientDto.builder().id(1).name("Google").code("GOOGLE").active(true).build();

        when(clientService.createClient(any(ClientRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Google"))
                .andExpect(jsonPath("$.code").value("GOOGLE"));
    }

    @Test
    public void testDeleteClient() throws Exception {
        doNothing().when(clientService).deleteClientByName("Google");

        mockMvc.perform(delete("/api/clients")
                .param("name", "Google"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Client company permanently deleted"));

        verify(clientService, times(1)).deleteClientByName("Google");
    }
}
