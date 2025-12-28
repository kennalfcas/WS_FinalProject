# Windows-compatible Dockerfile
FROM eclipse-temurin:17-jdk-nanoserver-1809 AS builder

WORKDIR /app

# Use relative paths only
COPY gradlew.bat .
COPY gradle gradle/
COPY build.gradle .
COPY settings.gradle .
COPY src src/

# Build
RUN gradlew.bat clean build -x test

FROM eclipse-temurin:17-jre-nanoserver-1809
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
