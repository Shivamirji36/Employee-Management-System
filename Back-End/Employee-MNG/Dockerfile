FROM amazoncorretto:17-alpine AS build
RUN apk add --no-cache maven
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -B -DskipTests

FROM amazoncorretto:17-alpine

# Install fontconfig and fonts — required for JasperReports on headless Linux
RUN apk add --no-cache fontconfig ttf-dejavu

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# -Djava.awt.headless=true  → fixes JasperReports crash on Render/Docker (no display)
# -Djava.awt.fonts          → tells AWT where to find fonts in Alpine
ENTRYPOINT ["java", "-Djava.awt.headless=true", "-jar", "app.jar"]