<<<<<<< HEAD
# Build stage
FROM eclipse-temurin:17-jdk-alpine AS builder
=======
# Use official OpenJDK 17 image
FROM eclipse-temurin:17-jdk-alpine
>>>>>>> 05036edc63b3370d71651e55e9fcacaf1723e5f0

WORKDIR /app

# Copy Gradle wrapper and config files first (caching optimization)
COPY gradlew .
COPY gradle gradle/
COPY build.gradle .
COPY settings.gradle .
COPY src src/

# Make gradlew executable and build
RUN chmod +x gradlew
RUN ./gradlew build --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
<<<<<<< HEAD
ENTRYPOINT ["java", "-jar", "app.jar"]
=======

# Command to run the application
CMD ["java", "-jar", "build/libs/*.jar"]
>>>>>>> 05036edc63b3370d71651e55e9fcacaf1723e5f0
