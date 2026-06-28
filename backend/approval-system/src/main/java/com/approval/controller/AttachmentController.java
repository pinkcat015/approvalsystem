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

    // ─── CẤU HÌNH FILE ĐÍNH KÈM ─────────────────────────────────
    // Whitelist các Content-Type được phép upload
    private static final java.util.Set<String> ALLOWED_CONTENT_TYPES = java.util.Set.of(
        "application/pdf",                                                                         // .pdf
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",                 // .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",                       // .xlsx
        "application/msword",                                                                      // .doc
        "application/vnd.ms-excel",                                                                // .xls
        "image/png",                                                                               // .png
        "image/jpeg"                                                                               // .jpg / .jpeg
    );

    // Giới hạn dung lượng file tối đa: 10MB
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    @PostMapping("/requests/{requestId}/attachments")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Long requestId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {

        // ── KIỂM TRA DUNG LƯỢNG FILE ─────────────────────────────
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest()
                    .body("Dung lượng file vượt quá giới hạn cho phép (tối đa 10MB). " +
                          "File hiện tại: " + String.format("%.2f", file.getSize() / 1024.0 / 1024.0) + " MB");
        }

        // ── KIỂM TRA LOẠI FILE ĐƯỢC PHÉP ─────────────────────────
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest()
                    .body("Loại file không được phép. Chỉ chấp nhận: PDF, DOCX, XLSX, DOC, XLS, PNG, JPG/JPEG. " +
                          "Loại file nhận được: " + contentType);
        }

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

        // Lưu file vật lý TRƯỚC khi ghi DB
        // Nếu ghi DB lỗi → transaction rollback → file sẽ bị xóa thủ công bên dưới
        Files.copy(file.getInputStream(), filePath);

        try {
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
        } catch (Exception e) {
            // Nếu lưu DB lỗi, xóa file vật lý đã lưu để tránh file mồ côi (orphan file)
            java.nio.file.Files.deleteIfExists(filePath);
            throw new RuntimeException("Không thể lưu thông tin file đính kèm: " + e.getMessage());
        }
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
