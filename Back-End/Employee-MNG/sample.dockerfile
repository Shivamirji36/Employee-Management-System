# Use Java 17
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN apk add --no-cache maven
RUN mvn dependency:go-offline

# Copy source
COPY src ./src

# Build
RUN mvn clean package -DskipTests

# Run
CMD ["java", "-jar", "target/Employee-MNG-0.0.1-SNAPSHOT.jar"]