FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=8080", "-Dspring.datasource.url=${DB_URL}", "-Dspring.datasource.username=${DB_USERNAME}", "-Dspring.datasource.password=${DB_PASSWORD}", "-Djwt.secret=${JWT_SECRET}", "-Dapp.cors.allowed-origins=${ALLOWED_ORIGINS}", "-Dspring.jpa.hibernate.ddl-auto=update", "-Dspring.jpa.open-in-view=false", "-jar", "app.jar"]