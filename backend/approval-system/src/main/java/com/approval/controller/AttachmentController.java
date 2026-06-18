package com.approval.controller;

import com.approval.entity.ApprovalRequest;
import com.approval.entity.Attachment;
import com.approval.entity.User;
import com.approval.repository.ApprovalRequestRepository;
import com.approval.repository.AttachmentRepository;
import com.approval.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;
    private final ApprovalRequestRepository requestRepository;
    private final UserRepository userRepository;

    // Cấu hình thư mục lưu trữ uploads
    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads";

    @PostMapping("/requests/{requestId}/attachments")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {

        ApprovalRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu ID: " + requestId));

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tạo thư mục nếu chưa tồn tại
        File uploadFolder = new File(UPLOAD_DIR);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        // Tạo tên file ngẫu nhiên để tránh trùng
        String originalName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalName != null && originalName.contains(".")) {
            fileExtension = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = Paths.get(UPLOAD_DIR, fileName);

        // Lưu file vật lý
        Files.copy(file.getInputStream(), filePath);

        // Lưu thông tin vào database
        Attachment attachment = Attachment.builder()
                .request(request)
                .fileName(fileName)
                .originalName(originalName)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(user)
                .build();

        Attachment saved = attachmentRepository.save(attachment);

        return ResponseEntity.ok(saved.getId());
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws MalformedURLException {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm ID: " + id));

        Path path = Paths.get(attachment.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists()) {
            throw new RuntimeException("File không tồn tại trên hệ thống");
        }

        String contentType = attachment.getContentType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<?> deleteAttachment(@PathVariable Long id, Authentication auth) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm ID: " + id));

        // Xóa file vật lý
        File file = new File(attachment.getFilePath());
        if (file.exists()) {
            file.delete();
        }

        attachmentRepository.delete(attachment);
        return ResponseEntity.noContent().build();
    }
}
