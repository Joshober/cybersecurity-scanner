package com.nutrition.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {
    
    @Value("${server.port:8080}")
    private String serverPort;
    
    @Bean
    public OpenAPI nutritionAppOpenAPI() {
        Server localServer = new Server();
        localServer.setUrl("http://localhost:" + serverPort);
        localServer.setDescription("Local Development Server");
        
        Server productionServer = new Server();
        productionServer.setUrl("https://api.nutrition-app.com");
        productionServer.setDescription("Production Server");
        
        Contact contact = new Contact();
        contact.setName("Nutrition App API Support");
        contact.setEmail("support@nutrition-app.com");
        
        License license = new License()
            .name("MIT License")
            .url("https://opensource.org/licenses/MIT");
        
        Info info = new Info()
            .title("Nutrition App API")
            .version("1.0.0")
            .description("""
                RESTful API for nutrition tracking mobile application.
                
                ## Features
                - Food recognition using TensorFlow Lite and OpenRouter
                - Portion size estimation
                - Nutrition tracking
                - Menu integration
                - User management
                
                ## Authentication
                This API uses Auth0 for authentication. Include the JWT token in the Authorization header:
                ```
                Authorization: Bearer <your-token>
                ```
                """)
            .contact(contact)
            .license(license);
        
        return new OpenAPI()
            .info(info)
            .servers(List.of(localServer, productionServer));
    }
}

