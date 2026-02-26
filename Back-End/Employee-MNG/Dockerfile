FROM amazoncorretto:17-alpine AS build
RUN apk add --no-cache maven
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -B -DskipTests

FROM amazoncorretto:17-alpine

# Fonts required for JasperReports on headless Linux
RUN apk add --no-cache fontconfig ttf-dejavu

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# -Xms: starting heap | -Xmx: max heap
# -XX:+UseG1GC: better GC for memory-constrained environments
ENTRYPOINT ["java", \
    "-Djava.awt.headless=true", \
    "-Xms256m", \
    "-Xmx512m", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-jar", "app.jar"]