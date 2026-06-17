package com.approval.service;

import com.approval.dto.WorkflowDto;
import com.approval.entity.*;
import com.approval.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final RequestTypeRepository requestTypeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public List<WorkflowDto.Response> getAll() {
        return workflowRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WorkflowDto.Response getById(Long id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy workflow ID: " + id));
        return toResponse(workflow);
    }

    public List<WorkflowDto.Response> getByRequestType(Long requestTypeId) {
        return workflowRepository.findByRequestTypeIdAndActiveTrue(requestTypeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public WorkflowDto.Response create(WorkflowDto.CreateRequest dto) {
        RequestType requestType = requestTypeRepository.findById(dto.getRequestTypeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy loại yêu cầu"));

        Workflow workflow = Workflow.builder()
                .requestType(requestType)
                .name(dto.getName())
                .description(dto.getDescription())
                .active(true)
                .version(1)
                .build();

        // Thêm các bước
        if (dto.getSteps() != null) {
            for (WorkflowDto.StepRequest stepDto : dto.getSteps()) {
                WorkflowStep step = buildStep(stepDto, workflow);
                workflow.getSteps().add(step);
            }
        }

        return toResponse(workflowRepository.save(workflow));
    }

    @Transactional
    public WorkflowDto.Response update(Long id, WorkflowDto.UpdateRequest dto) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy workflow"));

        if (dto.getName() != null) workflow.setName(dto.getName());
        if (dto.getDescription() != null) workflow.setDescription(dto.getDescription());
        if (dto.getActive() != null) workflow.setActive(dto.getActive());

        // Cập nhật steps — xóa cũ, thêm mới
        if (dto.getSteps() != null) {
            workflow.getSteps().clear();
            for (WorkflowDto.StepRequest stepDto : dto.getSteps()) {
                WorkflowStep step = buildStep(stepDto, workflow);
                workflow.getSteps().add(step);
            }
        }

        return toResponse(workflowRepository.save(workflow));
    }

    @Transactional
    public void delete(Long id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy workflow"));
        workflow.setActive(false);
        workflowRepository.save(workflow);
    }

    // Build WorkflowStep từ DTO
    private WorkflowStep buildStep(WorkflowDto.StepRequest dto, Workflow workflow) {
        WorkflowStep step = WorkflowStep.builder()
                .workflow(workflow)
                .stepOrder(dto.getStepOrder())
                .stepName(dto.getStepName())
                .approverType(dto.getApproverType())
                .approverRole(dto.getApproverRole())
                .timeoutHours(dto.getTimeoutHours() != null ? dto.getTimeoutHours() : 72)
                .parallel(dto.isParallel())
                .allowDelegate(dto.isAllowDelegate())
                .build();

        if (dto.getApproverUserId() != null) {
            userRepository.findById(dto.getApproverUserId())
                    .ifPresent(step::setApproverUser);
        }

        if (dto.getApproverDepartmentId() != null) {
            departmentRepository.findById(dto.getApproverDepartmentId())
                    .ifPresent(step::setApproverDepartment);
        }

        return step;
    }

    // Convert Entity → DTO
    private WorkflowDto.Response toResponse(Workflow w) {
        WorkflowDto.Response res = new WorkflowDto.Response();
        res.setId(w.getId());
        res.setName(w.getName());
        res.setDescription(w.getDescription());
        res.setActive(w.isActive());
        res.setVersion(w.getVersion());
        res.setCreatedAt(w.getCreatedAt());

        if (w.getRequestType() != null) {
            res.setRequestTypeId(w.getRequestType().getId());
            res.setRequestTypeName(w.getRequestType().getName());
        }

        res.setSteps(w.getSteps().stream().map(step -> {
            WorkflowDto.StepResponse s = new WorkflowDto.StepResponse();
            s.setId(step.getId());
            s.setStepOrder(step.getStepOrder());
            s.setStepName(step.getStepName());
            s.setApproverType(step.getApproverType());
            s.setApproverRole(step.getApproverRole());
            s.setTimeoutHours(step.getTimeoutHours());
            s.setParallel(step.isParallel());
            s.setAllowDelegate(step.isAllowDelegate());

            if (step.getApproverUser() != null) {
                s.setApproverUserId(step.getApproverUser().getId());
                s.setApproverUserName(step.getApproverUser().getFullName());
            }
            if (step.getApproverDepartment() != null) {
                s.setApproverDepartmentId(step.getApproverDepartment().getId());
                s.setApproverDepartmentName(step.getApproverDepartment().getName());
            }
            return s;
        }).toList());

        return res;
    }
}