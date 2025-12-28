# Multi-stage build (recommended)
FROM eclipse-temurin:17-jdk-alpine AS builder

# Set working directory
WORKDIR /app

# Copy Gradle wrapper and config files
COPY gradlew .
COPY gradle gradle/          # This copies the LOCAL gradle directory to /app/gradle/
COPY build.gradle .
COPY settings.gradle .
COPY src src/

# Make gradlew executable and build
RUN chmod +x gradlew
RUN ./gradlew build --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
