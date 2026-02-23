FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY pom.xml .
RUN apk add --no-cache maven
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

CMD ["java", "-jar", "target/Employee-MNG-0.0.1-SNAPSHOT.jar"]