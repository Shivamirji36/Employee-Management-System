FROM amazoncorretto:17-alpine AS build
RUN apk add --no-cache maven
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -B -DskipTests

FROM amazoncorretto:17-alpine

# Fonts required for JasperReports text rendering on headless Linux
RUN apk add --no-cache fontconfig ttf-dejavu

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Memory tuning for Render free tier (512MB total RAM):
# -Xms128m          start heap small
# -Xmx320m          max heap — leaves room for OS + JVM metaspace overhead
# -XX:+UseG1GC      best GC for memory-constrained environments
# -XX:+UseStringDeduplication  reduces duplicate string memory usage
# -Djava.awt.headless=true     required for JasperReports on servers with no display
ENTRYPOINT ["java", \
    "-Djava.awt.headless=true", \
    "-Xms128m", \
    "-Xmx320m", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:+UseStringDeduplication", \
    "-jar", "app.jar"]