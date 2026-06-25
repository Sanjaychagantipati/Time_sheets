package com.vergiltempo.config;

import com.vergiltempo.entity.Client;
import com.vergiltempo.entity.Role;
import com.vergiltempo.entity.Timesheet;
import com.vergiltempo.entity.User;
import com.vergiltempo.repository.ClientRepository;
import com.vergiltempo.repository.TimesheetRepository;
import com.vergiltempo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final TimesheetRepository timesheetRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ClientRepository clientRepository,
                           TimesheetRepository timesheetRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.timesheetRepository = timesheetRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Client createClient(String name, String code) {
        Client client = new Client();
        client.setName(name);
        client.setCode(code);
        client.setActive(true);
        return clientRepository.save(client);
    }

    private User createUser(String name, String username, String password, Role role, Client client, double hourlyRate) {
        User user = new User();
        user.setName(name);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setClient(client);
        user.setHourlyRate(BigDecimal.valueOf(hourlyRate));
        return userRepository.save(user);
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return;
        }

        // 1. Seed Clients
        Client microsoft = createClient("Microsoft", "MSFT");
        Client google = createClient("Google", "GOOG");
        Client meta = createClient("Meta", "META");
        Client amazon = createClient("Amazon", "AMZN");
        Client netflix = createClient("Netflix", "NFLX");

        // 2. Seed Users
        User admin = createUser("Staffing Manager", "admin", "admin123", Role.ADMIN, microsoft, 50.00);
        User sanjay = createUser("Sanjay", "sanjay", "emp123", Role.EMPLOYEE, microsoft, 35.00);
        User manjunath = createUser("Manjunath", "manjunath", "emp123", Role.EMPLOYEE, google, 30.00);
        User yogesh = createUser("Yogesh", "yogesh", "emp123", Role.EMPLOYEE, meta, 28.00);
        User anand = createUser("Anand", "anand", "emp123", Role.EMPLOYEE, amazon, 25.00);
        User narendra = createUser("Narendra", "narendra", "emp123", Role.EMPLOYEE, netflix, 40.00);

        // No automatic timesheets seeding to ensure the database starts empty.
    }
}
