package com.vergiltempo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.Map;

@SpringBootApplication
public class TimeSheetsApplication {

    public static void main(String[] args) {
        // Register a diagnostic shutdown hook to log the exact JVM termination cause
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.err.println("=== JVM SHUTDOWN HOOK TRIGGERED ===");
            Map<Thread, StackTraceElement[]> allStackTraces = Thread.getAllStackTraces();
            for (Map.Entry<Thread, StackTraceElement[]> entry : allStackTraces.entrySet()) {
                Thread thread = entry.getKey();
                StackTraceElement[] stack = entry.getValue();
                System.err.println("Thread: " + thread.getName() 
                    + " | Daemon: " + thread.isDaemon() 
                    + " | State: " + thread.getState());
                for (StackTraceElement element : stack) {
                    System.err.println("\tat " + element);
                }
            }
            System.err.println("===================================");
        }, "DiagnosticShutdownHook"));

        SpringApplication.run(TimeSheetsApplication.class, args);
    }
}

