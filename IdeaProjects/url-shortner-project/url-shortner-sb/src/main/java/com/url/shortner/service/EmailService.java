package com.url.shortner.service;

import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * EmailService - Handles sending emails via Mailjet HTTP API
 *
 * NOTE: Using HTTP API instead of SMTP because Render.com blocks outbound SMTP ports (25, 465, 587)
 *
 * Flow:
 * 1. UserService calls sendVerificationEmail() after user registration
 * 2. This service creates an HTML email with the verification link
 * 3. Email is sent via Mailjet HTTP API (port 443 - HTTPS, not blocked)
 * 4. User clicks the link to verify their email
 */
@Service
@Slf4j
public class EmailService {

    private final MailjetClient mailjetClient;
    private final String senderEmail;
    private final String senderName;

    public EmailService(
            @Value("${MAILJET_API_KEY}") String apiKey,
            @Value("${MAILJET_SECRET_KEY}") String secretKey,
            @Value("${MAILJET_SENDER_EMAIL}") String senderEmail) {

        ClientOptions options = ClientOptions.builder()
                .apiKey(apiKey)
                .apiSecretKey(secretKey)
                .build();

        this.mailjetClient = new MailjetClient(options);
        this.senderEmail = senderEmail;
        this.senderName = "Shortly";

        log.info("EmailService initialized with Mailjet HTTP API (sender: {})", senderEmail);
    }

    /**
     * Sends verification email to the user with a verification link
     * 
     * @param to - User's email address
     * @param username - User's username for personalized greeting
     * @param verificationLink - Full URL with verification token
     */
    public void sendVerificationEmail(String to, String username, String verificationLink) {
        try {
            String htmlContent = buildVerificationEmailHtml(username, verificationLink);

            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)
                                                    .put("Name", username)))
                                    .put(Emailv31.Message.SUBJECT, "Verify Your Email - Shortly")
                                    .put(Emailv31.Message.HTMLPART, htmlContent)));

            MailjetResponse response = mailjetClient.post(request);

            if (response.getStatus() == 200) {
                log.info("Verification email sent successfully to: {} (Status: {})", to, response.getStatus());
            } else {
                log.error("Mailjet API error - Status: {}, Data: {}", response.getStatus(), response.getData());
                throw new RuntimeException("Failed to send verification email. Mailjet returned status: " + response.getStatus());
            }

        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    /**
     * Resends verification email (used when user requests new verification link)
     */
    public void resendVerificationEmail(String to, String username, String verificationLink) {
        sendVerificationEmail(to, username, verificationLink);
        log.info("Verification email resent to: {}", to);
    }

    /**
     * Builds beautiful HTML email template for verification
     */
    private String buildVerificationEmailHtml(String username, String verificationLink) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                            🔗 Shortly
                        </h1>
                        <p style="color: #e8e8ff; margin-top: 10px; font-size: 16px;">
                            URL Shortener & Analytics Platform
                        </p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                            Welcome, %s! 👋
                        </h2>
                        
                        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Thank you for registering with Shortly! To complete your registration and start shortening URLs, please verify your email address by clicking the button below.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                ✓ Verify My Email
                            </a>
                        </div>
                        
                        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="color: #667eea; font-size: 14px; word-break: break-all; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                            %s
                        </p>
                        
                        <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px;">
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                ⏰ This verification link will expire in <strong>7 days</strong>.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin-top: 10px;">
                                If you didn't create an account with Shortly, you can safely ignore this email.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: #999999; font-size: 12px; margin: 0;">
                            © 2026 Shortly. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username, verificationLink, verificationLink);
    }
}

