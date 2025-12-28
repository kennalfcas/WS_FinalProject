package com.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.model.Proposal;

@Data
public class ProposalDTO {
    private Long id;
    private String coverLetter;
    private BigDecimal proposedAmount;
    private Integer estimatedDays;
    private String status;
    private LocalDateTime submittedAt;
    private JobDTO job;
    private UserDTO freelancer;
}