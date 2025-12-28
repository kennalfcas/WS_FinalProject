# Use official OpenJDK 17 image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory inside container
WORKDIR /app

# Copy all files from current directory to container
COPY . .

# Install dependencies and build the project
RUN chmod +x ./gradlew
RUN ./gradlew build --no-daemon

# Expose port 8080 (Spring Boot default)
EXPOSE 8080

# Command to run the application
CMD ["java", "-jar", "build/libs/*.jar"]
