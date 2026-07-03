package com.approval.config;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class S3Config {

    @Value("${s3.url}")
    private String s3Url;

    @Value("${s3.accessKey}")
    private String accessKey;

    @Value("${s3.secretKey}")
    private String secretKey;

    @Bean
    public AmazonS3 amazonS3() {
        AWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);

        return AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(s3Url, "us-east-1"))
                .withPathStyleAccessEnabled(true) // Bắt buộc bật true đối với MinIO
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .build();
    }
}
