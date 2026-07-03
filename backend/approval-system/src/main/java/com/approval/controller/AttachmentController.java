package com.approval.controller;

import com.approval.entity.ApprovalRequest;
import com.approval.entity.Attachment;
import com.approval.entity.User;
import com.approval.repository.ApprovalRequestRepository;
import com.approval.repository.AttachmentRepository;
import com.approval.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
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
    private final AmazonS3 amazonS3;

    @Value("${s3.bucketName}")
    private String s3BucketName;

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

        // BUG 9 FIX: Chỉ cho phép upload khi yêu cầu đang ở trạng thái hợp lệ
        // Không cho phép upload vào yêu cầu đang duyệt, đã duyệt, hay đã bị từ chối
        com.approval.enums.RequestStatus rs = request.getStatus();
        if (rs != com.approval.enums.RequestStatus.DRAFT
                && rs != com.approval.enums.RequestStatus.ON_HOLD
                && rs != com.approval.enums.RequestStatus.RETURNED) {
            return ResponseEntity.badRequest()
                    .body("Không thể đính kèm file vào yêu cầu đang trong quá trình duyệt hoặc đã kết thúc. " +
                          "Chỉ chấp nhận ở trạng thái: Nháp, Chờ bổ sung thông tin, Đã trả về. " +
                          "Trạng thái hiện tại: " + rs.name());
        }

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tạo tên file ngẫu nhiên để tránh trùng
        String originalName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalName != null && originalName.contains(".")) {
            fileExtension = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;

        // Lưu file lên S3 TRƯỚC khi ghi DB
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());
            amazonS3.putObject(s3BucketName, fileName, file.getInputStream(), metadata);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Lỗi khi tải file lên S3: " + e.getMessage());
        }

        try {
            Attachment attachment = Attachment.builder()
                    .request(request)
                    .fileName(fileName)
                    .originalName(originalName)
                    .filePath(fileName) // Trên S3 filePath chính là objectKey (fileName)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedBy(user)
                    .build();

            Attachment saved = attachmentRepository.save(attachment);
            return ResponseEntity.ok(saved.getId());
        } catch (Exception e) {
            // Nếu lưu DB lỗi, xóa file trên S3 để tránh file mồ côi
            amazonS3.deleteObject(s3BucketName, fileName);
            throw new RuntimeException("Không thể lưu thông tin file đính kèm: " + e.getMessage());
        }
    }


    @GetMapping("/attachments/{id}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm ID: " + id));

        String objectKey = attachment.getFilePath(); // Lưu ý filePath giờ chứa objectKey

        if (!amazonS3.doesObjectExist(s3BucketName, objectKey)) {
            throw new RuntimeException("File không tồn tại trên hệ thống S3");
        }

        S3Object s3Object = amazonS3.getObject(s3BucketName, objectKey);
        S3ObjectInputStream inputStream = s3Object.getObjectContent();
        Resource resource = new InputStreamResource(inputStream);

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

        // Xóa file trên S3
        String objectKey = attachment.getFilePath();
        if (amazonS3.doesObjectExist(s3BucketName, objectKey)) {
            amazonS3.deleteObject(s3BucketName, objectKey);
        }

        attachmentRepository.delete(attachment);
        return ResponseEntity.noContent().build();
    }
}
