# Fitness Microservices (fitness-microservices)

This repository contains a small microservices-based fitness platform. It includes backend services, an API gateway, a configuration server, a Eureka registry, a frontend, and supporting services used by the project.

Quick glance at the repository layout

- `eureka/` - Service discovery (Eureka server)
- `condigserver/` - Configuration server (note: folder name is `condigserver` in the repo)
- `gateway/` - API Gateway (Spring Cloud Gateway)
- `activityservice/` - Activity service (stores user activities)
- `aiservice/` - AI service (creates recommendations/processing, uses Kafka and/or other inputs)
- `userservice/` - User service (user data and validation)
- `fitness-frontend/` - Frontend (React + Vite)
- root `src/` - additional shared code or examples

Purpose and features

- Track user activities (coming from frontend, and later from watch devices)
- Provide AI-based recommendations for activities (AISERVICE)
- User validation with `userservice`
- Service discovery via Eureka
- Centralized configuration via config server
- API gateway to route requests
- Frontend for CRUD on activities and display recommendations
- Kafka integration for event-driven processing
- MongoDB as the primary storage for activities/recommendations

Prerequisites

- Java 17 (or the Java version declared in each service `pom.xml`)
- Maven 3.6+
- Node.js 16+ and npm/yarn (for the frontend)
- MongoDB (running on default port 27017 unless configured otherwise)
- (Optional) Kafka + Zookeeper (if you use Kafka flows)
- (Optional) Docker if you want to run services inside containers

Ports (default in this project)

- Eureka: 8761 (in `eureka` service)
- Config Server: (check `condigserver/src/main/resources/application.yaml`)
- Gateway: 8080 (or configured port in `gateway`)
- Activity Service: check `activityservice/src/main/resources/application.yml` (might default to 8081 or 8082)
- AI Service: check `aiservice/src/main/resources/application.yml`
- User Service: check `userservice/src/main/resources/application.yml`
- Frontend: typically `localhost:5173` (Vite default)

Check each microservice `application.yml`/`application.properties` to confirm actual ports. If you get "Port 8080 already in use" when starting a service, confirm the service's configured server.port and ensure no other process (including another microservice) binds the same port.

Recommended run order (local development)

1. Start infrastructure: MongoDB, Kafka (if used), Zookeeper (if used).
2. Start Eureka (`eureka`) so services can register.
3. Start Config Server (`condigserver`) so other services can fetch config.
4. Start `userservice` (so other services can validate users if needed).
5. Start `activityservice` and `aiservice`.
6. Start `gateway`.
7. Start the frontend (`fitness-frontend`).

Commands (examples)

From the project root run (adjust for your Java/mvnw setup):

```bash
# Build everything (top-level Maven)
./mvnw -T 1C clean package -DskipTests

# Or build a single service, e.g. activityservice
cd activityservice
./mvnw spring-boot:run
```

Frontend

```bash
cd fitness-frontend
npm install
npm run dev
```

Common issues & fixes (based on errors you've seen)

1) "Web server failed to start. Port 8080 was already in use."
- Cause: Another process (or another microservice) is already listening on the same port.
- Fixes:
  - Open the service's `application.yml` (e.g. `activityservice/src/main/resources/application.yml`) and set `server.port` to a unique port.
  - On Linux, find process: `lsof -i :8080` or `ss -ltnp | grep 8080` and stop/kill that process if it's unintended.
  - If your gateway using 8080 conflicts with another service, change gateway to 8080 and services to 8xxx, or vice-versa.

2) Eureka connectivity: "Connect to http://localhost:8761 failed: Connection refused"
- Cause: A client (e.g. `aiservice`) tries to register to Eureka but the Eureka server is not running or wrong URL configured.
- Fixes:
  - Start `eureka` before services that register to it.
  - Check `spring.cloud.discovery.client.simple` / `eureka.client.service-url.defaultZone` in the service `application.yml`. It should point to the running Eureka server URL (e.g. `http://localhost:8761/eureka/`).
  - If you intentionally don't want registration (standalone run), disable Eureka client in that service: `eureka.client.enabled=false` or `spring.autoconfigure.exclude` for discovery client.

3) UnsatisfiedDependencyException for `geminiService` / WebClient.Builder injection
- Cause: Spring could not provide a bean for a constructor parameter (e.g., `WebClient.Builder`) or other required dependency.
- Fix:
  - Provide a `WebClient.Builder` bean explicitly in a `@Configuration` class:

```java
// Example config
@Configuration
public class WebClientConfig {
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
```

  - Or include the appropriate Spring Boot starter (spring-boot-starter-webflux) that auto-configures `WebClient.Builder`.
  - If you want a load-balanced WebClient for inter-service calls via gateway/Eureka, annotate with `@LoadBalanced` and use Spring Cloud dependencies.

4) Return statements causing NullPointerException
- Cause: Returning `null` from a method and then callers try to call methods on the returned object.
- Fix:
  - Avoid returning `null`. Return `Optional<T>` where appropriate, or throw an exception.
  - Example: `Optional<Activity> findById(...)` — caller should handle `Optional.empty()` safely.
  - Always null-check results before dereferencing.

5) MongoDB error: "Field 'locale' is invalid in: { locale: \"activities\" }"
- Cause: Some query or index creation is attempting to use `locale` incorrectly. `locale` is a special option in text search commands in newer MongoDB versions and must be in the correct position or format.
- Likely causes:
  - Your repository or `MongoTemplate` query is building a query document that puts `locale` as a top-level field of the query (invalid).
  - You might be using `Collation` or text search incorrectly.
- Fixes:
  - If you're doing text search, use the proper API: use `TextCriteria` or `$text` queries through Spring Data MongoDB.
  - If you need collation, use `Collation` objects on the query, not an explicit `locale` field in the query document.

Example: using Spring Data text search

```java
TextCriteria criteria = TextCriteria.forDefaultLanguage().matching("activities");
Query query = TextQuery.queryText(criteria);
List<Activity> results = mongoTemplate.find(query, Activity.class);
```

If you need collation:

```java
Query q = new Query(Criteria.where("userId").is(userId));
q.collation(Collation.of("en").strength(Collation.ComparisonLevel.secondary()));
```

6) Kafka bootstrap/disconnected warnings
- Cause: Kafka client cannot connect to the configured bootstrap broker (localhost:9092)
- Fixes:
  - Ensure Kafka and Zookeeper are running.
  - If using Docker, ensure correct container networking (expose 9092 etc.).
  - Verify `spring.kafka.bootstrap-servers` matches your Kafka address.
  - Configure consumer/producer client properties (timeouts, retries) if needed.

Transactional delete (frontend delete affecting multiple collections)

- Current behavior: frontend issues DELETE request and backend deletes activity and recommendation records.
- To ensure both deletes succeed or both fail use a transaction (MongoDB supports multi-document transactions only on replica sets). Options:
  - If using a single MongoDB instance (non-replica), consider implementing a compensating delete (delete recommendation then activity; if second fails, retry or mark for cleanup).
  - Better: run MongoDB as a replica set locally (even a single-node replica set) so you can use transactions and call repo methods inside a `@Transactional` block.

Auto-delete every 1.5 months

- Use Spring Scheduling to run a cleanup job periodically. Example:

```java
// run every 45 days (1.5 months ~= 45 days)
@Scheduled(fixedDelayString = "#{T(java.time.Duration).ofDays(45).toMillis()}")
public void cleanupOldActivities() {
    // find and delete activities older than 45 days
}
```

Make sure `@EnableScheduling` is present on a configuration class or the main application class.

Security and validation

- Users validation from `userservice`: make sure `userservice` is up and reachable. If you call user validation synchronously from other services, consider:
  - Circuit breakers (Resilience4j) to avoid cascading failures when `userservice` is down.
  - Timeouts and retries on WebClient/RestTemplate.

Debugging tips

- Enable debug logging in Spring Boot: add `--debug` or set `logging.level.org.springframework=DEBUG` to see the condition evaluation report.
- When services fail to start, inspect stack traces for the root cause (the first exception often makes it clear).
- Use `lsof`, `ss`, or `netstat` to find port conflicts.

Suggested quick fixes for issues you reported earlier

- Add a `WebClient.Builder` bean if `UnsatisfiedDependencyException` caused by `WebClient.Builder` missing.
- Ensure Eureka is started before `aiservice` and other clients; or disable Eureka client if not required during local runs.
- Fix Mongo queries that include `locale` as a top-level field — use `TextCriteria` or `Collation`.
- For Kafka, ensure broker address and that Kafka is reachable from the JVM host/container.

Development workflow

- Build all: `./mvnw clean package -DskipTests`
- Run a service: `cd activityservice && ./mvnw spring-boot:run`
- Frontend: `cd fitness-frontend && npm install && npm run dev`

Testing

- Each service may contain unit/integration tests. Use `./mvnw test` inside each service folder.

Contributing

- Create an issue describing the bug or feature.
- Open a PR from a branch with a clear title and description.

Notes and next steps for you (tailored suggestions based on your logs)

- Ensure `eureka` runs first so `aiservice` can register and fetch registry.
- Add explicit `WebClient.Builder` bean or include `spring-boot-starter-webflux` if you rely on auto-configured builder.
- Fix Mongo query generation to avoid `locale` as a top-level field (use Spring Data text search/collation APIs).
- For the delete flow: implement an atomic delete using Mongo transactions or a reliable compensating/cleanup strategy.

Contact / Support

- If you share the exact `application.yml` of the service that keeps failing (e.g. `aiservice/src/main/resources/application.yml`) and the exact methods that build Mongo queries, I can provide exact code fixes.
