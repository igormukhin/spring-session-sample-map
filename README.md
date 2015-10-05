Spring Session on Spring Boot using ConcurrentMap as a session storage
======================================================================

Demonstrates using Spring Session with Spring Boot and Spring Security.
You can log in with the username "user" and the password "password".
Stores session data in a ConcurrentMap instead of Redis.

If you start with `-Dspring.profiles.active=persistent`,
you will get persistent sessions over application/server restarts.