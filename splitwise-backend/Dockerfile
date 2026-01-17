FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package


FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", \
  "-Xms128m", \
  "-Xmx512m", \
  "-XX:+UseG1GC", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar" \
]
