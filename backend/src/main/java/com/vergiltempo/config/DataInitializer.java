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

        // 3. Seed Timesheets for the last 6 days
        LocalDate now = LocalDate.now();
        List<User> employees = List.of(sanjay, manjunath, yogesh, anand, narendra);
        for (int i = 6; i >= 1; i--) {
            LocalDate date = now.minusDays(i);
            for (int idx = 0; idx < employees.size(); idx++) {
                User emp = employees.get(idx);
                if ((idx + i) % 5 == 0) {
                    continue; // Skip some days randomly
                }

                int checkInHour = 8 + (idx % 2);
                int checkInMinute = 15 * (idx % 4);
                double workedHours = 8.0 + (idx % 2) * 0.5 + (i % 2) * 0.25;

                LocalTime clockIn = LocalTime.of(checkInHour, checkInMinute);
                long workedMinutes = Math.round(workedHours * 60);
                LocalTime clockOut = clockIn.plusMinutes(workedMinutes);

                String[] noteSamples = {
                        "Working on project codebase optimization.",
                        "Wireframes design and review feedback integration.",
                        "Engineering standup and server setup.",
                        "Client presentation planning & deck revision.",
                        "Resolving layout issues on checkout flows."
                };
                String note = noteSamples[(idx + i) % noteSamples.length];

                String[] locations = {
                        "Remote (Boston Office)",
                        "Remote (Home Office)",
                        "HQ - Conference Room B",
                        "Co-working Space"
                };
                String location = locations[(idx + i) % locations.length];

                Timesheet ts = new Timesheet();
                ts.setUser(emp);
                ts.setClient(emp.getClient());
                ts.setDate(date);
                ts.setClockIn(clockIn);
                ts.setClockOut(clockOut);
                ts.setHours(BigDecimal.valueOf(workedHours).setScale(2, java.math.RoundingMode.HALF_UP));
                ts.setNotes(note);
                ts.setLocation(location);
                timesheetRepository.save(ts);
            }
        }
    }
}
