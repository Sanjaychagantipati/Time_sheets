package com.vergiltempo.service;

import java.io.Writer;

public interface ReportService {
    void writeMasterCsv(Writer writer, String userId, String client, String startDate, String endDate);
    void writeMonthlyCsv(Writer writer, String userId, String month);
}
