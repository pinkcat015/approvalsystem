package com.approval.controller;

import com.approval.repository.ApprovalRequestRepository;
import com.approval.repository.AttachmentRepository;
import com.approval.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class AttachmentControllerTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private ApprovalRequestRepository requestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttachmentController attachmentController;

    private Authentication auth;

    @BeforeEach
    void setUp() {
        auth = mock(Authentication.class);
    }

    @Test
    void testUploadAttachment_TooLarge() throws IOException {
        // Mock file larger than 10MB (11MB)
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                new byte[11 * 1024 * 1024]
        );

        ResponseEntity<?> response = attachmentController.uploadAttachment(1L, file, auth);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Dung lượng file vượt quá giới hạn cho phép (tối đa 10MB). File hiện tại: 11.00 MB", response.getBody());
    }

    @Test
    void testUploadAttachment_InvalidType() throws IOException {
        // Mock invalid executable file type
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.exe",
                "application/x-msdownload",
                new byte[100]
        );

        ResponseEntity<?> response = attachmentController.uploadAttachment(1L, file, auth);

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Loại file không được phép. Chỉ chấp nhận: PDF, DOCX, XLSX, DOC, XLS, PNG, JPG/JPEG. Loại file nhận được: application/x-msdownload", response.getBody());
    }
}
